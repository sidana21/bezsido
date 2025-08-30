var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adminCredentials: () => adminCredentials,
  affiliateLinks: () => affiliateLinks,
  appFeatures: () => appFeatures,
  cartItems: () => cartItems,
  chats: () => chats,
  commissions: () => commissions,
  contacts: () => contacts,
  insertAdminCredentialsSchema: () => insertAdminCredentialsSchema,
  insertAffiliateLinkSchema: () => insertAffiliateLinkSchema,
  insertAppFeatureSchema: () => insertAppFeatureSchema,
  insertCartItemSchema: () => insertCartItemSchema,
  insertChatSchema: () => insertChatSchema,
  insertCommissionSchema: () => insertCommissionSchema,
  insertContactSchema: () => insertContactSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertOrderItemSchema: () => insertOrderItemSchema,
  insertOrderSchema: () => insertOrderSchema,
  insertOtpSchema: () => insertOtpSchema,
  insertProductSchema: () => insertProductSchema,
  insertSessionSchema: () => insertSessionSchema,
  insertStickerSchema: () => insertStickerSchema,
  insertStoreSchema: () => insertStoreSchema,
  insertStoryCommentSchema: () => insertStoryCommentSchema,
  insertStoryLikeSchema: () => insertStoryLikeSchema,
  insertStorySchema: () => insertStorySchema,
  insertUserSchema: () => insertUserSchema,
  insertVerificationRequestSchema: () => insertVerificationRequestSchema,
  messages: () => messages,
  orderItems: () => orderItems,
  orders: () => orders,
  otpCodes: () => otpCodes,
  products: () => products,
  sessions: () => sessions,
  stickers: () => stickers,
  stores: () => stores,
  stories: () => stories,
  storyComments: () => storyComments,
  storyLikes: () => storyLikes,
  users: () => users,
  verificationRequests: () => verificationRequests
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, jsonb, decimal, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users, sessions, otpCodes, chats, messages, adminCredentials, appFeatures, insertUserSchema, insertSessionSchema, insertOtpSchema, insertChatSchema, stickers, stories, insertMessageSchema, insertStorySchema, insertStickerSchema, stores, products, affiliateLinks, commissions, contacts, cartItems, orders, orderItems, insertStoreSchema, insertProductSchema, insertAffiliateLinkSchema, insertCommissionSchema, insertContactSchema, insertCartItemSchema, insertOrderSchema, insertOrderItemSchema, verificationRequests, insertVerificationRequestSchema, storyLikes, storyComments, insertStoryLikeSchema, insertStoryCommentSchema, insertAdminCredentialsSchema, insertAppFeatureSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    users = pgTable("users", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      phoneNumber: varchar("phone_number").notNull().unique(),
      name: text("name").notNull(),
      avatar: text("avatar"),
      location: text("location").notNull(),
      // المنطقة الجغرافية
      isOnline: boolean("is_online").default(false),
      isVerified: boolean("is_verified").default(false),
      // Account verification status
      verifiedAt: timestamp("verified_at"),
      // When account was verified
      isAdmin: boolean("is_admin").default(false),
      // Admin privileges
      lastSeen: timestamp("last_seen").defaultNow(),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    sessions = pgTable("sessions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id),
      token: varchar("token").notNull().unique(),
      expiresAt: timestamp("expires_at").notNull(),
      createdAt: timestamp("created_at").defaultNow()
    });
    otpCodes = pgTable("otp_codes", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      phoneNumber: varchar("phone_number").notNull(),
      code: varchar("code").notNull(),
      expiresAt: timestamp("expires_at").notNull(),
      isUsed: boolean("is_used").default(false),
      createdAt: timestamp("created_at").defaultNow()
    });
    chats = pgTable("chats", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name"),
      isGroup: boolean("is_group").default(false),
      avatar: text("avatar"),
      participants: jsonb("participants").$type().notNull(),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    messages = pgTable("messages", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      chatId: varchar("chat_id").notNull().references(() => chats.id),
      senderId: varchar("sender_id").notNull().references(() => users.id),
      content: text("content"),
      messageType: text("message_type").notNull().default("text"),
      // text, image, file, audio, location, sticker
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
      deletedAt: timestamp("deleted_at")
    });
    adminCredentials = pgTable("admin_credentials", {
      id: varchar("id").primaryKey().default("admin_settings"),
      email: text("email").notNull(),
      password: text("password").notNull(),
      updatedAt: timestamp("updated_at").defaultNow(),
      createdAt: timestamp("created_at").defaultNow()
    });
    appFeatures = pgTable("app_features", {
      id: varchar("id").primaryKey(),
      name: text("name").notNull(),
      description: text("description").notNull(),
      isEnabled: boolean("is_enabled").default(true),
      category: text("category").notNull().default("general"),
      // messaging, marketplace, social, admin, etc.
      priority: integer("priority").default(0),
      // Display order in admin panel
      updatedAt: timestamp("updated_at").defaultNow(),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertUserSchema = createInsertSchema(users).omit({
      id: true,
      isVerified: true,
      verifiedAt: true,
      isAdmin: true,
      lastSeen: true,
      createdAt: true,
      updatedAt: true
    });
    insertSessionSchema = createInsertSchema(sessions).omit({
      id: true,
      createdAt: true
    });
    insertOtpSchema = createInsertSchema(otpCodes).omit({
      id: true,
      createdAt: true
    });
    insertChatSchema = createInsertSchema(chats).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    stickers = pgTable("stickers", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      imageUrl: text("image_url").notNull(),
      category: text("category").notNull().default("general"),
      // general, emoji, business, fun
      isActive: boolean("is_active").default(true),
      sortOrder: integer("sort_order").default(0),
      createdAt: timestamp("created_at").defaultNow()
    });
    stories = pgTable("stories", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id),
      location: text("location").notNull(),
      // المنطقة الجغرافية للحالة
      content: text("content"),
      imageUrl: text("image_url"),
      videoUrl: text("video_url"),
      backgroundColor: text("background_color").default("#075e54"),
      textColor: text("text_color").default("#ffffff"),
      timestamp: timestamp("timestamp").defaultNow(),
      expiresAt: timestamp("expires_at").notNull(),
      viewCount: text("view_count").default("0"),
      // Store as text to handle large numbers
      viewers: jsonb("viewers").$type().default([])
    });
    insertMessageSchema = createInsertSchema(messages).omit({
      id: true,
      timestamp: true
    });
    insertStorySchema = createInsertSchema(stories).omit({
      id: true,
      timestamp: true,
      viewCount: true
    });
    insertStickerSchema = createInsertSchema(stickers).omit({
      id: true,
      createdAt: true
    });
    stores = pgTable("stores", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id),
      // Store owner
      name: text("name").notNull(),
      description: text("description").notNull(),
      imageUrl: text("image_url"),
      category: text("category").notNull(),
      location: text("location").notNull(),
      // Store location
      phoneNumber: text("phone_number"),
      isOpen: boolean("is_open").default(true),
      isActive: boolean("is_active").default(false),
      // Default to false until approved
      status: text("status").notNull().default("pending"),
      // pending, approved, rejected, suspended
      isVerified: boolean("is_verified").default(false),
      // Store verification status
      verifiedAt: timestamp("verified_at"),
      // When store was verified
      approvedAt: timestamp("approved_at"),
      // When store was approved
      approvedBy: varchar("approved_by").references(() => users.id),
      // Admin who approved
      rejectionReason: text("rejection_reason"),
      // Reason for rejection
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    products = pgTable("products", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id),
      // Product owner
      storeId: varchar("store_id").references(() => stores.id),
      // Optional: link to store
      name: text("name").notNull(),
      description: text("description").notNull(),
      price: decimal("price").notNull(),
      imageUrl: text("image_url"),
      category: text("category").notNull(),
      location: text("location").notNull(),
      // Where product is available
      isActive: boolean("is_active").default(true),
      commissionRate: decimal("commission_rate").notNull().default("0.05"),
      // 5% default commission
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    affiliateLinks = pgTable("affiliate_links", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      productId: varchar("product_id").notNull().references(() => products.id),
      affiliateId: varchar("affiliate_id").notNull().references(() => users.id),
      // Person sharing the link
      uniqueCode: varchar("unique_code").notNull().unique(),
      // Unique tracking code
      clicks: text("clicks").default("0"),
      // Number of clicks
      conversions: text("conversions").default("0"),
      // Number of purchases
      totalCommission: decimal("total_commission").default("0"),
      // Total commission earned
      createdAt: timestamp("created_at").defaultNow()
    });
    commissions = pgTable("commissions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      affiliateLinkId: varchar("affiliate_link_id").notNull().references(() => affiliateLinks.id),
      buyerId: varchar("buyer_id").notNull().references(() => users.id),
      // Person who bought
      amount: decimal("amount").notNull(),
      // Commission amount
      status: text("status").notNull().default("pending"),
      // pending, paid, cancelled
      transactionId: varchar("transaction_id"),
      // Optional transaction reference
      createdAt: timestamp("created_at").defaultNow(),
      paidAt: timestamp("paid_at")
    });
    contacts = pgTable("contacts", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id),
      // User who added the contact
      contactUserId: varchar("contact_user_id").references(() => users.id),
      // Contact's user ID (if they have app)
      phoneNumber: varchar("phone_number").notNull(),
      // Contact's phone number
      name: text("name").notNull(),
      // Contact's name (user-defined)
      isAppUser: boolean("is_app_user").default(false),
      // Whether contact has the app
      createdAt: timestamp("created_at").defaultNow()
    });
    cartItems = pgTable("cart_items", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id),
      // Cart owner
      productId: varchar("product_id").notNull().references(() => products.id),
      quantity: text("quantity").notNull().default("1"),
      // Quantity as text to handle large numbers
      addedAt: timestamp("added_at").defaultNow()
    });
    orders = pgTable("orders", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      buyerId: varchar("buyer_id").notNull().references(() => users.id),
      // Customer
      sellerId: varchar("seller_id").notNull().references(() => users.id),
      // Store owner
      storeId: varchar("store_id").references(() => stores.id),
      // Optional store reference
      totalAmount: decimal("total_amount").notNull(),
      // Total order value
      status: text("status").notNull().default("pending"),
      // pending, confirmed, prepared, delivered, cancelled
      paymentMethod: text("payment_method").notNull().default("cash_on_delivery"),
      // cash_on_delivery, bank_transfer, etc.
      deliveryAddress: text("delivery_address").notNull(),
      // Customer delivery address
      customerPhone: text("customer_phone").notNull(),
      // Customer contact
      customerName: text("customer_name").notNull(),
      // Customer name
      notes: text("notes"),
      // Order notes/comments
      orderDate: timestamp("order_date").defaultNow(),
      confirmedAt: timestamp("confirmed_at"),
      deliveredAt: timestamp("delivered_at"),
      cancelledAt: timestamp("cancelled_at"),
      cancellationReason: text("cancellation_reason")
    });
    orderItems = pgTable("order_items", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      orderId: varchar("order_id").notNull().references(() => orders.id),
      productId: varchar("product_id").notNull().references(() => products.id),
      productName: text("product_name").notNull(),
      // Store product name at time of order
      productPrice: decimal("product_price").notNull(),
      // Store product price at time of order
      quantity: text("quantity").notNull(),
      // Quantity ordered
      subtotal: decimal("subtotal").notNull()
      // price * quantity
    });
    insertStoreSchema = createInsertSchema(stores).omit({
      id: true,
      status: true,
      isVerified: true,
      verifiedAt: true,
      approvedAt: true,
      approvedBy: true,
      rejectionReason: true,
      createdAt: true,
      updatedAt: true
    });
    insertProductSchema = createInsertSchema(products).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertAffiliateLinkSchema = createInsertSchema(affiliateLinks).omit({
      id: true,
      uniqueCode: true,
      clicks: true,
      conversions: true,
      totalCommission: true,
      createdAt: true
    });
    insertCommissionSchema = createInsertSchema(commissions).omit({
      id: true,
      createdAt: true,
      paidAt: true
    });
    insertContactSchema = createInsertSchema(contacts).omit({
      id: true,
      createdAt: true
    });
    insertCartItemSchema = createInsertSchema(cartItems).omit({
      id: true,
      addedAt: true
    });
    insertOrderSchema = createInsertSchema(orders).omit({
      id: true,
      orderDate: true,
      confirmedAt: true,
      deliveredAt: true,
      cancelledAt: true
    });
    insertOrderItemSchema = createInsertSchema(orderItems).omit({
      id: true,
      orderId: true
    });
    verificationRequests = pgTable("verification_requests", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id),
      // User requesting verification
      storeId: varchar("store_id").references(() => stores.id),
      // Optional: for store verification requests
      requestType: text("request_type").notNull(),
      // "user" or "store"
      status: text("status").notNull().default("pending"),
      // pending, approved, rejected
      documents: jsonb("documents").$type().default([]),
      // Document URLs submitted
      reason: text("reason"),
      // User's reason for requesting verification
      adminNote: text("admin_note"),
      // Admin's note (for approval/rejection)
      submittedAt: timestamp("submitted_at").defaultNow(),
      reviewedAt: timestamp("reviewed_at"),
      reviewedBy: varchar("reviewed_by").references(() => users.id)
      // Admin who reviewed the request
    });
    insertVerificationRequestSchema = createInsertSchema(verificationRequests).omit({
      id: true,
      submittedAt: true,
      reviewedAt: true
    });
    storyLikes = pgTable("story_likes", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      storyId: varchar("story_id").notNull().references(() => stories.id),
      userId: varchar("user_id").notNull().references(() => users.id),
      reactionType: text("reaction_type").notNull().default("like"),
      // like, love, laugh, sad, angry
      createdAt: timestamp("created_at").defaultNow()
    });
    storyComments = pgTable("story_comments", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      storyId: varchar("story_id").notNull().references(() => stories.id),
      userId: varchar("user_id").notNull().references(() => users.id),
      content: text("content").notNull(),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertStoryLikeSchema = createInsertSchema(storyLikes).omit({
      id: true,
      createdAt: true
    });
    insertStoryCommentSchema = createInsertSchema(storyComments).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertAdminCredentialsSchema = createInsertSchema(adminCredentials).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertAppFeatureSchema = createInsertSchema(appFeatures).omit({
      createdAt: true,
      updatedAt: true
    });
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  db: () => db,
  pool: () => pool
});
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
var pool, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    neonConfig.webSocketConstructor = ws;
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
      );
    }
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema: schema_exports });
  }
});

// server/index.ts
import express3 from "express";

// server/routes.ts
import express from "express";
import { createServer } from "http";

// server/storage.ts
init_schema();
import { randomUUID } from "crypto";
import { sql as sql2 } from "drizzle-orm";
import { eq } from "drizzle-orm";
var db2 = null;
var MemStorage = class {
  users;
  chats;
  messages;
  stories;
  sessions;
  otpCodes;
  stores;
  products;
  affiliateLinks;
  commissions;
  contacts;
  cartItems;
  orders;
  orderItems;
  verificationRequests;
  storyLikes;
  storyComments;
  stickers;
  adminCredentials;
  features;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.chats = /* @__PURE__ */ new Map();
    this.messages = /* @__PURE__ */ new Map();
    this.stories = /* @__PURE__ */ new Map();
    this.sessions = /* @__PURE__ */ new Map();
    this.otpCodes = /* @__PURE__ */ new Map();
    this.stores = /* @__PURE__ */ new Map();
    this.products = /* @__PURE__ */ new Map();
    this.affiliateLinks = /* @__PURE__ */ new Map();
    this.commissions = /* @__PURE__ */ new Map();
    this.contacts = /* @__PURE__ */ new Map();
    this.cartItems = /* @__PURE__ */ new Map();
    this.orders = /* @__PURE__ */ new Map();
    this.orderItems = /* @__PURE__ */ new Map();
    this.verificationRequests = /* @__PURE__ */ new Map();
    this.storyLikes = /* @__PURE__ */ new Map();
    this.storyComments = /* @__PURE__ */ new Map();
    this.stickers = /* @__PURE__ */ new Map();
    this.features = /* @__PURE__ */ new Map();
    this.initializeMockData();
    this.initializeTestSession();
    this.initializeMockComments();
    this.initializeDefaultFeatures();
  }
  initializeTestSession() {
    const testSession = {
      id: "test-session-123",
      userId: "current-user",
      token: "test-token-123",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1e3),
      // 24 hours from now
      createdAt: /* @__PURE__ */ new Date()
    };
    this.sessions.set(testSession.token, testSession);
  }
  initializeMockComments() {
    const mockComments = [
      {
        id: "comment-1",
        storyId: "story-sarah-1",
        userId: "current-user",
        content: "\u0635\u0648\u0631\u0629 \u0631\u0627\u0626\u0639\u0629! \u{1F60D}",
        createdAt: new Date(Date.now() - 36e5),
        // 1 hour ago
        updatedAt: new Date(Date.now() - 36e5)
      },
      {
        id: "comment-2",
        storyId: "story-sarah-1",
        userId: "ahmed-user",
        content: "\u0645\u0646\u0627\u0638\u0631 \u062C\u0645\u064A\u0644\u0629 \u062C\u062F\u0627\u064B \u{1F31F}",
        createdAt: new Date(Date.now() - 18e5),
        // 30 minutes ago
        updatedAt: new Date(Date.now() - 18e5)
      },
      {
        id: "comment-3",
        storyId: "story-fatima-1",
        userId: "sarah-user",
        content: "\u0646\u0639\u0645 \u064A\u0648\u0645 \u062C\u0645\u064A\u0644 \u0641\u0639\u0644\u0627\u064B \u2600\uFE0F",
        createdAt: new Date(Date.now() - 9e5),
        // 15 minutes ago
        updatedAt: new Date(Date.now() - 9e5)
      }
    ];
    mockComments.forEach((comment) => {
      this.storyComments.set(comment.id, comment);
    });
  }
  initializeMockData() {
    const currentUser = {
      id: "current-user",
      phoneNumber: "+213555123456",
      name: "\u0623\u0646\u0627",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
      location: "\u062A\u0646\u062F\u0648\u0641",
      isOnline: true,
      isVerified: true,
      verifiedAt: /* @__PURE__ */ new Date(),
      isAdmin: true,
      // Make current user admin
      lastSeen: /* @__PURE__ */ new Date(),
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    const sarahUser = {
      id: "sarah-user",
      phoneNumber: "+213555234567",
      name: "\u0633\u0627\u0631\u0629 \u0623\u062D\u0645\u062F",
      avatar: "https://pixabay.com/get/g5ede2eab7ebacb14e91863d35be3f093549755f13131724e5e19c6a49a45921c44adc3a540b01f28abed2c4568cf8e907881a83c9d0679b2c22c054985afc7d2_1280.jpg",
      location: "\u062A\u0646\u062F\u0648\u0641",
      isOnline: true,
      isVerified: true,
      // Made verified for testing
      verifiedAt: new Date(Date.now() - 432e5),
      // 12 hours ago
      isAdmin: false,
      lastSeen: /* @__PURE__ */ new Date(),
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    const ahmedUser = {
      id: "ahmed-user",
      phoneNumber: "+213555345678",
      name: "\u0623\u062D\u0645\u062F \u0645\u062D\u0645\u062F",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
      location: "\u0648\u0647\u0631\u0627\u0646",
      isOnline: false,
      isVerified: true,
      verifiedAt: new Date(Date.now() - 864e5),
      isAdmin: false,
      lastSeen: new Date(Date.now() - 864e5),
      // 1 day ago
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    const fatimaUser = {
      id: "fatima-user",
      phoneNumber: "+213555456789",
      name: "\u0641\u0627\u0637\u0645\u0629 \u0639\u0644\u064A",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
      location: "\u062A\u0646\u062F\u0648\u0641",
      isOnline: true,
      isVerified: false,
      verifiedAt: null,
      isAdmin: false,
      lastSeen: /* @__PURE__ */ new Date(),
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    const mariamUser = {
      id: "mariam-user",
      phoneNumber: "+213555567890",
      name: "\u0645\u0631\u064A\u0645 \u062D\u0633\u0646",
      avatar: "https://images.unsplash.com/photo-1589156191108-c762ff4b96ab?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
      location: "\u0642\u0633\u0646\u0637\u064A\u0646\u0629",
      isOnline: true,
      isVerified: true,
      verifiedAt: new Date(Date.now() - 1728e5),
      isAdmin: false,
      lastSeen: /* @__PURE__ */ new Date(),
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    const yousefUser = {
      id: "yousef-user",
      phoneNumber: "+213555678901",
      name: "\u064A\u0648\u0633\u0641 \u0625\u0628\u0631\u0627\u0647\u064A\u0645",
      avatar: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
      location: "\u0639\u0646\u0627\u0628\u0629",
      isOnline: false,
      isVerified: false,
      verifiedAt: null,
      isAdmin: false,
      lastSeen: new Date(Date.now() - 1728e5),
      // 2 days ago
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    const abdullahUser = {
      id: "abdullah-user",
      phoneNumber: "+213555789012",
      name: "\u0639\u0628\u062F\u0627\u0644\u0644\u0647 \u062E\u0627\u0644\u062F",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
      location: "\u0633\u0637\u064A\u0641",
      isOnline: false,
      isVerified: false,
      verifiedAt: null,
      isAdmin: false,
      lastSeen: new Date(Date.now() - 2592e5),
      // 3 days ago
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    const lailaUser = {
      id: "laila-user",
      phoneNumber: "+213555890123",
      name: "\u0644\u064A\u0644\u0649 \u0623\u062D\u0645\u062F",
      avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
      location: "\u0628\u0627\u062A\u0646\u0629",
      isOnline: false,
      isVerified: false,
      verifiedAt: null,
      isAdmin: false,
      lastSeen: new Date(Date.now() - 3456e5),
      // 4 days ago
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    const storeOwner1 = {
      id: "user-store-1",
      phoneNumber: "+213555123456",
      name: "\u0635\u0627\u062D\u0628 \u0645\u062A\u062C\u0631 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A",
      avatar: "https://i.pravatar.cc/150?img=11",
      location: "\u062A\u0646\u062F\u0648\u0641",
      isOnline: true,
      isVerified: true,
      verifiedAt: new Date(Date.now() - 6048e5),
      // 7 days ago
      isAdmin: false,
      lastSeen: /* @__PURE__ */ new Date(),
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    const storeOwner2 = {
      id: "user-store-2",
      phoneNumber: "+213555789123",
      name: "\u0635\u0627\u062D\u0628 \u0628\u0642\u0627\u0644\u0629 \u0627\u0644\u0639\u0627\u0626\u0644\u0629",
      avatar: "https://i.pravatar.cc/150?img=12",
      location: "\u062A\u0646\u062F\u0648\u0641",
      isOnline: false,
      isVerified: false,
      verifiedAt: null,
      isAdmin: false,
      lastSeen: new Date(Date.now() - 30 * 60 * 1e3),
      // 30 minutes ago
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    const storeOwner3 = {
      id: "user-store-3",
      phoneNumber: "+213555456789",
      name: "\u0635\u0627\u062D\u0628 \u0645\u062E\u0628\u0632 \u0627\u0644\u0623\u0635\u0627\u0644\u0629",
      avatar: "https://i.pravatar.cc/150?img=13",
      location: "\u062A\u0646\u062F\u0648\u0641",
      isOnline: false,
      isVerified: true,
      verifiedAt: new Date(Date.now() - 12096e5),
      // 14 days ago
      isAdmin: false,
      lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1e3),
      // 2 hours ago
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    [currentUser, sarahUser, ahmedUser, fatimaUser, mariamUser, yousefUser, abdullahUser, lailaUser, storeOwner1, storeOwner2, storeOwner3].forEach((user) => {
      this.users.set(user.id, user);
    });
    const sarahChat = {
      id: "chat-sarah",
      name: null,
      isGroup: false,
      avatar: null,
      participants: ["current-user", "sarah-user"],
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    const ahmedChat = {
      id: "chat-ahmed",
      name: null,
      isGroup: false,
      avatar: null,
      participants: ["current-user", "ahmed-user"],
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    const groupChat = {
      id: "chat-group",
      name: "\u0645\u062C\u0645\u0648\u0639\u0629 \u0627\u0644\u0623\u0635\u062F\u0642\u0627\u0621",
      isGroup: true,
      avatar: "https://images.unsplash.com/photo-1529111290557-82f6d5c6cf85?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
      participants: ["current-user", "sarah-user", "ahmed-user", "fatima-user"],
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    const fatimaChat = {
      id: "chat-fatima",
      name: null,
      isGroup: false,
      avatar: null,
      participants: ["current-user", "fatima-user"],
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    [sarahChat, ahmedChat, groupChat, fatimaChat].forEach((chat) => {
      this.chats.set(chat.id, chat);
    });
    const sarahMessages = [
      {
        id: "msg-1",
        chatId: "chat-sarah",
        senderId: "sarah-user",
        content: "\u0623\u0647\u0644\u0627\u064B! \u0643\u064A\u0641 \u062D\u0627\u0644\u0643\u061F \u{1F60A}",
        messageType: "text",
        imageUrl: null,
        audioUrl: null,
        stickerUrl: null,
        stickerId: null,
        locationLat: null,
        locationLon: null,
        locationName: null,
        replyToMessageId: null,
        timestamp: new Date(Date.now() - 18e5),
        // 30 min ago
        isRead: true,
        isDelivered: true,
        isEdited: false,
        editedAt: null,
        deletedAt: null
      },
      {
        id: "msg-2",
        chatId: "chat-sarah",
        senderId: "current-user",
        content: "\u0627\u0644\u062D\u0645\u062F \u0644\u0644\u0647 \u0628\u062E\u064A\u0631! \u0648\u0623\u0646\u062A \u0643\u064A\u0641 \u062D\u0627\u0644\u0643\u061F",
        messageType: "text",
        imageUrl: null,
        audioUrl: null,
        stickerUrl: null,
        stickerId: null,
        locationLat: null,
        locationLon: null,
        locationName: null,
        replyToMessageId: null,
        timestamp: new Date(Date.now() - 174e4),
        // 29 min ago
        isRead: true,
        isDelivered: true,
        isEdited: false,
        editedAt: null,
        deletedAt: null
      },
      {
        id: "msg-3",
        chatId: "chat-sarah",
        senderId: "sarah-user",
        content: "\u0634\u0627\u0647\u062F \u0647\u0630\u0627 \u0627\u0644\u0645\u0646\u0638\u0631 \u0627\u0644\u0631\u0627\u0626\u0639!",
        messageType: "image",
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300",
        audioUrl: null,
        stickerUrl: null,
        stickerId: null,
        locationLat: null,
        locationLon: null,
        locationName: null,
        replyToMessageId: null,
        timestamp: new Date(Date.now() - 15e5),
        // 25 min ago
        isRead: true,
        isDelivered: true,
        isEdited: false,
        editedAt: null,
        deletedAt: null
      },
      {
        id: "msg-4",
        chatId: "chat-sarah",
        senderId: "current-user",
        content: "\u0648\u0627\u0648! \u{1F60D} \u0645\u0646\u0638\u0631 \u062E\u0644\u0627\u0628 \u0641\u0639\u0644\u0627\u064B. \u0623\u064A\u0646 \u0647\u0630\u0627 \u0627\u0644\u0645\u0643\u0627\u0646\u061F",
        messageType: "text",
        imageUrl: null,
        audioUrl: null,
        stickerUrl: null,
        stickerId: null,
        locationLat: null,
        locationLon: null,
        locationName: null,
        replyToMessageId: null,
        timestamp: new Date(Date.now() - 144e4),
        // 24 min ago
        isRead: true,
        isDelivered: true,
        isEdited: false,
        editedAt: null,
        deletedAt: null
      },
      {
        id: "msg-5",
        chatId: "chat-sarah",
        senderId: "sarah-user",
        content: "\u0647\u0630\u0627 \u0641\u064A \u062C\u0628\u0627\u0644 \u0627\u0644\u0623\u0644\u0628 \u0627\u0644\u0633\u0648\u064A\u0633\u0631\u064A\u0629 \u{1F3D4}\uFE0F",
        messageType: "text",
        imageUrl: null,
        audioUrl: null,
        stickerUrl: null,
        stickerId: null,
        locationLat: null,
        locationLon: null,
        locationName: null,
        replyToMessageId: null,
        timestamp: new Date(Date.now() - 138e4),
        // 23 min ago
        isRead: true,
        isDelivered: true,
        isEdited: false,
        editedAt: null,
        deletedAt: null
      },
      {
        id: "msg-6",
        chatId: "chat-sarah",
        senderId: "sarah-user",
        content: "\u0648\u0647\u0630\u0627 \u0627\u0644\u063A\u062F\u0627\u0621 \u0627\u0644\u0630\u064A \u062A\u0646\u0627\u0648\u0644\u062A\u0647 \u0647\u0646\u0627\u0643 \u{1F37D}\uFE0F",
        messageType: "image",
        imageUrl: "https://pixabay.com/get/gea1be77aa5dcbc2d39439c59e6b5feac148a0dfca36adf924c39583adb8620c2dc7693eb1b91ae3403b59786254a797ddd8c179d871743545cf7ddeb15b970ef_1280.jpg",
        audioUrl: null,
        stickerUrl: null,
        stickerId: null,
        locationLat: null,
        locationLon: null,
        locationName: null,
        replyToMessageId: null,
        timestamp: new Date(Date.now() - 132e4),
        // 22 min ago
        isRead: true,
        isDelivered: true,
        isEdited: false,
        editedAt: null,
        deletedAt: null
      },
      {
        id: "msg-7",
        chatId: "chat-sarah",
        senderId: "current-user",
        content: "\u064A\u0628\u062F\u0648 \u0644\u0630\u064A\u0630\u0627\u064B \u062C\u062F\u0627\u064B! \u{1F924} \u0645\u062A\u0649 \u0633\u062A\u0639\u0648\u062F\u064A\u0646\u061F",
        messageType: "text",
        imageUrl: null,
        audioUrl: null,
        stickerUrl: null,
        stickerId: null,
        locationLat: null,
        locationLon: null,
        locationName: null,
        replyToMessageId: null,
        timestamp: new Date(Date.now() - 12e5),
        // 20 min ago
        isRead: true,
        isDelivered: true,
        isEdited: false,
        editedAt: null,
        deletedAt: null
      },
      {
        id: "msg-8",
        chatId: "chat-sarah",
        senderId: "sarah-user",
        content: "\u0633\u0623\u0639\u0648\u062F \u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0627\u0644\u0642\u0627\u062F\u0645 \u0625\u0646 \u0634\u0627\u0621 \u0627\u0644\u0644\u0647",
        messageType: "image",
        imageUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300",
        audioUrl: null,
        stickerUrl: null,
        stickerId: null,
        locationLat: null,
        locationLon: null,
        locationName: null,
        replyToMessageId: null,
        timestamp: new Date(Date.now() - 114e4),
        // 19 min ago
        isRead: true,
        isDelivered: true,
        isEdited: false,
        editedAt: null,
        deletedAt: null
      },
      {
        id: "msg-9",
        chatId: "chat-sarah",
        senderId: "current-user",
        content: "\u0628\u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629\u060C \u0647\u0644 \u062A\u062A\u0630\u0643\u0631\u064A\u0646 \u0647\u0630\u0627 \u0627\u0644\u0645\u0643\u0627\u0646\u061F \u{1F332}",
        messageType: "image",
        imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300",
        audioUrl: null,
        stickerUrl: null,
        stickerId: null,
        locationLat: null,
        locationLon: null,
        locationName: null,
        replyToMessageId: null,
        timestamp: new Date(Date.now() - 102e4),
        // 17 min ago
        isRead: true,
        isDelivered: true,
        isEdited: false,
        editedAt: null,
        deletedAt: null
      },
      {
        id: "msg-10",
        chatId: "chat-sarah",
        senderId: "sarah-user",
        content: "\u0623\u062C\u0644! \u0627\u0644\u0645\u0642\u0647\u0649 \u0627\u0644\u0630\u064A \u0643\u0646\u0627 \u0646\u0630\u0647\u0628 \u0625\u0644\u064A\u0647 \u2615",
        messageType: "image",
        imageUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300",
        audioUrl: null,
        stickerUrl: null,
        stickerId: null,
        locationLat: null,
        locationLon: null,
        locationName: null,
        replyToMessageId: null,
        timestamp: new Date(Date.now() - 96e4),
        // 16 min ago
        isRead: true,
        isDelivered: true,
        isEdited: false,
        editedAt: null,
        deletedAt: null
      },
      {
        id: "msg-11",
        chatId: "chat-sarah",
        senderId: "current-user",
        content: "\u0646\u0639\u0645! \u0630\u0643\u0631\u064A\u0627\u062A \u062C\u0645\u064A\u0644\u0629 \u{1F60A} \u0633\u0623\u0646\u062A\u0638\u0631 \u0639\u0648\u062F\u062A\u0643",
        messageType: "text",
        imageUrl: null,
        audioUrl: null,
        stickerUrl: null,
        stickerId: null,
        locationLat: null,
        locationLon: null,
        locationName: null,
        replyToMessageId: null,
        timestamp: new Date(Date.now() - 9e5),
        // 15 min ago
        isRead: false,
        isDelivered: true,
        isEdited: false,
        editedAt: null,
        deletedAt: null
      }
    ];
    sarahMessages.forEach((message) => {
      this.messages.set(message.id, message);
    });
    const mockStories = [
      {
        id: "story-sarah-1",
        userId: "sarah-user",
        location: "\u062A\u0646\u062F\u0648\u0641",
        content: "\u0641\u064A \u0631\u062D\u0644\u0629 \u062C\u0645\u064A\u0644\u0629 \u{1F31F}",
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=600",
        videoUrl: null,
        backgroundColor: "#075e54",
        textColor: "#ffffff",
        timestamp: new Date(Date.now() - 36e5),
        // 1 hour ago
        expiresAt: new Date(Date.now() + 828e5),
        // expires in 23 hours
        viewCount: "5",
        viewers: ["current-user", "ahmed-user"]
      },
      {
        id: "story-fatima-1",
        userId: "fatima-user",
        location: "\u062A\u0646\u062F\u0648\u0641",
        content: "\u064A\u0648\u0645 \u0631\u0627\u0626\u0639! \u2600\uFE0F",
        imageUrl: null,
        videoUrl: null,
        backgroundColor: "#25D366",
        textColor: "#ffffff",
        timestamp: new Date(Date.now() - 72e5),
        // 2 hours ago
        expiresAt: new Date(Date.now() + 792e5),
        // expires in 22 hours
        viewCount: "12",
        viewers: ["current-user"]
      },
      {
        id: "story-mariam-1",
        userId: "mariam-user",
        location: "\u0627\u0644\u062C\u0632\u0627\u0626\u0631",
        content: null,
        imageUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=600",
        videoUrl: null,
        backgroundColor: "#075e54",
        textColor: "#ffffff",
        timestamp: new Date(Date.now() - 108e5),
        // 3 hours ago
        expiresAt: new Date(Date.now() + 756e5),
        // expires in 21 hours
        viewCount: "8",
        viewers: ["current-user", "sarah-user", "ahmed-user"]
      }
    ];
    mockStories.forEach((story) => {
      this.stories.set(story.id, story);
    });
    const mockProducts = [
      {
        id: "product-1",
        userId: "user-store-1",
        // Electronics store owner
        storeId: "store-1",
        name: "\u0633\u0645\u0627\u0639\u0629 \u0628\u0644\u0648\u062A\u0648\u062B \u0644\u0627\u0633\u0644\u0643\u064A\u0629",
        description: "\u0633\u0645\u0627\u0639\u0629 \u0639\u0627\u0644\u064A\u0629 \u0627\u0644\u062C\u0648\u062F\u0629 \u0645\u0639 \u062A\u0642\u0646\u064A\u0629 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0636\u0648\u0636\u0627\u0621 \u0648\u0628\u0637\u0627\u0631\u064A\u0629 \u062A\u062F\u0648\u0645 24 \u0633\u0627\u0639\u0629",
        price: "15000",
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        category: "\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A",
        location: "\u062A\u0646\u062F\u0648\u0641",
        isActive: true,
        commissionRate: "0.08",
        // 8% commission
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "product-2",
        userId: "user-store-1",
        storeId: "store-1",
        name: "\u0634\u0627\u062D\u0646 \u0633\u0631\u064A\u0639 \u0644\u0644\u0647\u0627\u062A\u0641",
        description: "\u0634\u0627\u062D\u0646 \u0633\u0631\u064A\u0639 65W \u0645\u062A\u0648\u0627\u0641\u0642 \u0645\u0639 \u062C\u0645\u064A\u0639 \u0627\u0644\u0647\u0648\u0627\u062A\u0641 \u0627\u0644\u0630\u0643\u064A\u0629",
        price: "3500",
        imageUrl: "https://images.unsplash.com/photo-1583394838336-acd977736f90?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        category: "\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A",
        location: "\u062A\u0646\u062F\u0648\u0641",
        isActive: true,
        commissionRate: "0.10",
        // 10% commission
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "product-3",
        userId: "user-store-2",
        // Grocery store owner
        storeId: "store-2",
        name: "\u0639\u0633\u0644 \u0637\u0628\u064A\u0639\u064A \u0635\u062D\u0631\u0627\u0648\u064A",
        description: "\u0639\u0633\u0644 \u0637\u0628\u064A\u0639\u064A 100% \u0645\u0646 \u0627\u0644\u0635\u062D\u0631\u0627\u0621 \u0627\u0644\u062C\u0632\u0627\u0626\u0631\u064A\u0629\u060C \u063A\u0646\u064A \u0628\u0627\u0644\u0641\u0648\u0627\u0626\u062F \u0627\u0644\u0637\u0628\u064A\u0629",
        price: "2500",
        imageUrl: "https://images.unsplash.com/photo-1587049332474-964043d9ce5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        category: "\u0623\u063A\u0630\u064A\u0629 \u0637\u0628\u064A\u0639\u064A\u0629",
        location: "\u062A\u0646\u062F\u0648\u0641",
        isActive: true,
        commissionRate: "0.12",
        // 12% commission
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "product-4",
        userId: "user-store-3",
        // Bakery owner
        storeId: "store-3",
        name: "\u062E\u0628\u0632 \u062A\u0646\u062F\u0648\u0641 \u0627\u0644\u062A\u0642\u0644\u064A\u062F\u064A",
        description: "\u062E\u0628\u0632 \u0637\u0627\u0632\u062C \u064A\u0648\u0645\u064A\u0627\u064B \u0645\u0646 \u0627\u0644\u0641\u0631\u0646 \u0627\u0644\u062A\u0642\u0644\u064A\u062F\u064A \u0628\u0648\u0635\u0641\u0629 \u0645\u062D\u0644\u064A\u0629 \u0623\u0635\u064A\u0644\u0629",
        price: "150",
        imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        category: "\u0645\u062E\u0628\u0648\u0632\u0627\u062A",
        location: "\u062A\u0646\u062F\u0648\u0641",
        isActive: true,
        commissionRate: "0.15",
        // 15% commission
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "product-5",
        userId: "sarah-user",
        // Regular user selling
        storeId: null,
        name: "\u062D\u0642\u064A\u0628\u0629 \u064A\u062F \u0646\u0633\u0627\u0626\u064A\u0629",
        description: "\u062D\u0642\u064A\u0628\u0629 \u0623\u0646\u064A\u0642\u0629 \u0645\u0635\u0646\u0648\u0639\u0629 \u0645\u0646 \u0627\u0644\u062C\u0644\u062F \u0627\u0644\u0637\u0628\u064A\u0639\u064A\u060C \u0645\u0646\u0627\u0633\u0628\u0629 \u0644\u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0627\u062A",
        price: "8500",
        imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        category: "\u0623\u0632\u064A\u0627\u0621 \u0648\u0625\u0643\u0633\u0633\u0648\u0627\u0631",
        location: "\u062A\u0646\u062F\u0648\u0641",
        isActive: true,
        commissionRate: "0.06",
        // 6% commission
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }
    ];
    mockProducts.forEach((product) => {
      this.products.set(product.id, product);
    });
    const mockAffiliateLinks = [
      {
        id: "aff-1",
        productId: "product-1",
        affiliateId: "current-user",
        uniqueCode: "AFF001HEADPHONES",
        clicks: "15",
        conversions: "3",
        totalCommission: "3600",
        // 15000 * 0.08 * 3
        createdAt: new Date(Date.now() - 864e5)
        // 1 day ago
      },
      {
        id: "aff-2",
        productId: "product-3",
        affiliateId: "current-user",
        uniqueCode: "AFF002HONEY",
        clicks: "8",
        conversions: "2",
        totalCommission: "600",
        // 2500 * 0.12 * 2
        createdAt: new Date(Date.now() - 1728e5)
        // 2 days ago
      }
    ];
    mockAffiliateLinks.forEach((link) => {
      this.affiliateLinks.set(link.id, link);
    });
    const mockCommissions = [
      {
        id: "comm-1",
        affiliateLinkId: "aff-1",
        buyerId: "sarah-user",
        amount: "1200",
        // 15000 * 0.08
        status: "paid",
        transactionId: "txn-001",
        createdAt: new Date(Date.now() - 864e5),
        paidAt: new Date(Date.now() - 432e5)
        // paid 12 hours ago
      },
      {
        id: "comm-2",
        affiliateLinkId: "aff-1",
        buyerId: "ahmed-user",
        amount: "1200",
        status: "pending",
        transactionId: "txn-002",
        createdAt: new Date(Date.now() - 216e5),
        // 6 hours ago
        paidAt: null
      },
      {
        id: "comm-3",
        affiliateLinkId: "aff-2",
        buyerId: "fatima-user",
        amount: "300",
        // 2500 * 0.12
        status: "paid",
        transactionId: "txn-003",
        createdAt: new Date(Date.now() - 1728e5),
        paidAt: new Date(Date.now() - 864e5)
      }
    ];
    mockCommissions.forEach((commission) => {
      this.commissions.set(commission.id, commission);
    });
    const mockContacts = [
      {
        id: "contact-1",
        userId: "current-user",
        contactUserId: "sarah-user",
        phoneNumber: "+213555234567",
        name: "\u0633\u0627\u0631\u0629 \u0623\u062D\u0645\u062F",
        isAppUser: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "contact-2",
        userId: "current-user",
        contactUserId: "ahmed-user",
        phoneNumber: "+213555345678",
        name: "\u0623\u062D\u0645\u062F \u0645\u062D\u0645\u062F",
        isAppUser: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "contact-3",
        userId: "current-user",
        contactUserId: "fatima-user",
        phoneNumber: "+213555456789",
        name: "\u0641\u0627\u0637\u0645\u0629 \u0639\u0644\u064A",
        isAppUser: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "contact-4",
        userId: "current-user",
        contactUserId: null,
        phoneNumber: "+213555123999",
        name: "\u062E\u0627\u0644\u062F \u062D\u0633\u0646",
        isAppUser: false,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "contact-5",
        userId: "current-user",
        contactUserId: null,
        phoneNumber: "+213555887766",
        name: "\u0646\u0648\u0631 \u0627\u0644\u062F\u064A\u0646",
        isAppUser: false,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "contact-6",
        userId: "current-user",
        contactUserId: "mariam-user",
        phoneNumber: "+213555567890",
        name: "\u0645\u0631\u064A\u0645 \u062D\u0633\u0646",
        isAppUser: true,
        createdAt: /* @__PURE__ */ new Date()
      }
    ];
    mockContacts.forEach((contact) => {
      this.contacts.set(contact.id, contact);
    });
    const additionalUsers = [
      {
        id: "khalil-user",
        phoneNumber: "+213555111222",
        name: "\u062E\u0644\u064A\u0644 \u0628\u0646 \u0639\u0645\u0631",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        location: "\u062A\u0646\u062F\u0648\u0641",
        isOnline: true,
        isVerified: true,
        verifiedAt: new Date(Date.now() - 3456e5),
        isAdmin: false,
        lastSeen: /* @__PURE__ */ new Date(),
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "amina-user",
        phoneNumber: "+213555333444",
        name: "\u0623\u0645\u064A\u0646\u0629 \u0645\u062D\u0645\u0648\u062F",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        location: "\u0648\u0647\u0631\u0627\u0646",
        isOnline: false,
        isVerified: false,
        verifiedAt: null,
        isAdmin: false,
        lastSeen: new Date(Date.now() - 36e5),
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "rashid-user",
        phoneNumber: "+213555555666",
        name: "\u0631\u0634\u064A\u062F \u0627\u0644\u0639\u0644\u064A",
        avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        location: "\u0627\u0644\u062C\u0632\u0627\u0626\u0631",
        isOnline: true,
        isVerified: true,
        verifiedAt: new Date(Date.now() - 6048e5),
        isAdmin: false,
        lastSeen: /* @__PURE__ */ new Date(),
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "nadia-user",
        phoneNumber: "+213555777888",
        name: "\u0646\u0627\u062F\u064A\u0629 \u0633\u0644\u0627\u0645",
        avatar: "https://images.unsplash.com/photo-1589156191108-c762ff4b96ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        location: "\u0642\u0633\u0646\u0637\u064A\u0646\u0629",
        isOnline: false,
        isVerified: true,
        verifiedAt: new Date(Date.now() - 1728e5),
        isAdmin: false,
        lastSeen: new Date(Date.now() - 18e5),
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "omar-user",
        phoneNumber: "+213555999000",
        name: "\u0639\u0645\u0631 \u062D\u0633\u064A\u0646",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        location: "\u062A\u0646\u062F\u0648\u0641",
        isOnline: true,
        isVerified: false,
        verifiedAt: null,
        isAdmin: false,
        lastSeen: /* @__PURE__ */ new Date(),
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }
    ];
    additionalUsers.forEach((user) => {
      this.users.set(user.id, user);
    });
    const mockStores = [
      {
        id: "store-1",
        userId: "user-store-1",
        name: "\u0645\u062A\u062C\u0631 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A \u0627\u0644\u0645\u062A\u0642\u062F\u0645\u0629",
        description: "\u0645\u062A\u062C\u0631 \u0645\u062A\u062E\u0635\u0635 \u0641\u064A \u0628\u064A\u0639 \u0623\u062D\u062F\u062B \u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0629 \u0648\u0627\u0644\u0647\u0648\u0627\u062A\u0641 \u0627\u0644\u0630\u0643\u064A\u0629 \u0648\u0625\u0643\u0633\u0633\u0648\u0627\u0631\u0627\u062A\u0647\u0627",
        imageUrl: "https://images.unsplash.com/photo-1560472355-536de3962603?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
        category: "\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A",
        location: "\u062A\u0646\u062F\u0648\u0641",
        phoneNumber: "+213555123456",
        isOpen: true,
        isActive: true,
        status: "approved",
        isVerified: true,
        verifiedAt: new Date(Date.now() - 6048e5),
        approvedAt: new Date(Date.now() - 6048e5),
        approvedBy: "admin-user",
        rejectionReason: null,
        createdAt: new Date(Date.now() - 2592e6),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "store-2",
        userId: "user-store-2",
        name: "\u0628\u0642\u0627\u0644\u0629 \u0627\u0644\u0639\u0627\u0626\u0644\u0629 \u0627\u0644\u0643\u0628\u0631\u0649",
        description: "\u0628\u0642\u0627\u0644\u0629 \u0634\u0627\u0645\u0644\u0629 \u062A\u0642\u062F\u0645 \u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u063A\u0630\u0627\u0626\u064A\u0629 \u0648\u0627\u0644\u0645\u0646\u0632\u0644\u064A\u0629 \u0628\u0623\u0633\u0639\u0627\u0631 \u0645\u0646\u0627\u0633\u0628\u0629",
        imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
        category: "\u0645\u0648\u0627\u062F \u063A\u0630\u0627\u0626\u064A\u0629",
        location: "\u062A\u0646\u062F\u0648\u0641",
        phoneNumber: "+213555789123",
        isOpen: true,
        isActive: false,
        status: "pending",
        isVerified: false,
        verifiedAt: null,
        approvedAt: null,
        approvedBy: null,
        rejectionReason: null,
        createdAt: new Date(Date.now() - 1296e6),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "store-3",
        userId: "user-store-3",
        name: "\u0645\u062E\u0628\u0632 \u0627\u0644\u0623\u0635\u0627\u0644\u0629",
        description: "\u0645\u062E\u0628\u0632 \u062A\u0642\u0644\u064A\u062F\u064A \u064A\u0646\u062A\u062C \u0627\u0644\u062E\u0628\u0632 \u0648\u0627\u0644\u0645\u0639\u062C\u0646\u0627\u062A \u0627\u0644\u0637\u0627\u0632\u062C\u0629 \u064A\u0648\u0645\u064A\u0627\u064B \u0628\u0648\u0635\u0641\u0627\u062A \u0645\u062D\u0644\u064A\u0629 \u0623\u0635\u064A\u0644\u0629",
        imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
        category: "\u0645\u062E\u0628\u0648\u0632\u0627\u062A",
        location: "\u062A\u0646\u062F\u0648\u0641",
        phoneNumber: "+213555456789",
        isOpen: true,
        isActive: true,
        status: "approved",
        isVerified: true,
        verifiedAt: new Date(Date.now() - 12096e5),
        approvedAt: new Date(Date.now() - 12096e5),
        approvedBy: "admin-user",
        rejectionReason: null,
        createdAt: new Date(Date.now() - 1728e6),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "store-4",
        userId: "khalil-user",
        name: "\u0635\u064A\u062F\u0644\u064A\u0629 \u0627\u0644\u0646\u0648\u0631",
        description: "\u0635\u064A\u062F\u0644\u064A\u0629 \u0634\u0627\u0645\u0644\u0629 \u062A\u0642\u062F\u0645 \u062C\u0645\u064A\u0639 \u0627\u0644\u0623\u062F\u0648\u064A\u0629 \u0648\u0627\u0644\u0645\u0633\u062A\u062D\u0636\u0631\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0648\u0627\u0644\u062A\u062C\u0645\u064A\u0644\u064A\u0629",
        imageUrl: "https://images.unsplash.com/photo-1576602976047-174e57a47881?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
        category: "\u0635\u064A\u062F\u0644\u0629 \u0648\u0645\u0633\u062A\u062D\u0636\u0631\u0627\u062A \u0637\u0628\u064A\u0629",
        location: "\u062A\u0646\u062F\u0648\u0641",
        phoneNumber: "+213555111222",
        isOpen: true,
        isActive: true,
        status: "approved",
        isVerified: true,
        verifiedAt: new Date(Date.now() - 3456e5),
        approvedAt: new Date(Date.now() - 3456e5),
        approvedBy: "admin-user",
        rejectionReason: null,
        createdAt: new Date(Date.now() - 864e6),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "store-5",
        userId: "rashid-user",
        name: "\u0648\u0631\u0634\u0629 \u0627\u0644\u0633\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u062A\u062E\u0635\u0635\u0629",
        description: "\u0648\u0631\u0634\u0629 \u062A\u0635\u0644\u064A\u062D \u0648\u0635\u064A\u0627\u0646\u0629 \u0627\u0644\u0633\u064A\u0627\u0631\u0627\u062A \u0645\u0639 \u062E\u062F\u0645\u0629 \u0642\u0637\u0639 \u0627\u0644\u063A\u064A\u0627\u0631 \u0627\u0644\u0623\u0635\u0644\u064A\u0629",
        imageUrl: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
        category: "\u0642\u0637\u0639 \u063A\u064A\u0627\u0631 \u0648\u062E\u062F\u0645\u0627\u062A \u0633\u064A\u0627\u0631\u0627\u062A",
        location: "\u0627\u0644\u062C\u0632\u0627\u0626\u0631",
        phoneNumber: "+213555555666",
        isOpen: false,
        isActive: true,
        status: "approved",
        isVerified: true,
        verifiedAt: new Date(Date.now() - 6048e5),
        approvedAt: new Date(Date.now() - 6048e5),
        approvedBy: "admin-user",
        rejectionReason: null,
        createdAt: new Date(Date.now() - 15552e5),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "store-6",
        userId: "nadia-user",
        name: "\u0645\u062D\u0644 \u0627\u0644\u0623\u0632\u064A\u0627\u0621 \u0627\u0644\u0639\u0635\u0631\u064A\u0629",
        description: "\u0645\u062A\u062C\u0631 \u0623\u0632\u064A\u0627\u0621 \u0646\u0633\u0627\u0626\u064A\u0629 \u0639\u0635\u0631\u064A\u0629 \u064A\u0642\u062F\u0645 \u0623\u062D\u062F\u062B \u0627\u0644\u0645\u0648\u0636\u0627\u062A \u0648\u0627\u0644\u0625\u0643\u0633\u0633\u0648\u0627\u0631\u0627\u062A",
        imageUrl: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
        category: "\u0623\u0632\u064A\u0627\u0621 \u0648\u0625\u0643\u0633\u0633\u0648\u0627\u0631",
        location: "\u0642\u0633\u0646\u0637\u064A\u0646\u0629",
        phoneNumber: "+213555777888",
        isOpen: true,
        isActive: false,
        status: "pending",
        isVerified: false,
        verifiedAt: null,
        approvedAt: null,
        approvedBy: null,
        rejectionReason: null,
        createdAt: new Date(Date.now() - 216e7),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "store-7",
        userId: "omar-user",
        name: "\u0645\u0642\u0647\u0649 \u0627\u0644\u0634\u0628\u0627\u0628",
        description: "\u0645\u0642\u0647\u0649 \u0639\u0635\u0631\u064A \u064A\u0642\u062F\u0645 \u0627\u0644\u0645\u0634\u0631\u0648\u0628\u0627\u062A \u0627\u0644\u0633\u0627\u062E\u0646\u0629 \u0648\u0627\u0644\u0628\u0627\u0631\u062F\u0629 \u0648\u0627\u0644\u0648\u062C\u0628\u0627\u062A \u0627\u0644\u062E\u0641\u064A\u0641\u0629",
        imageUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
        category: "\u0645\u0637\u0627\u0639\u0645 \u0648\u0645\u0642\u0627\u0647\u064A",
        location: "\u062A\u0646\u062F\u0648\u0641",
        phoneNumber: "+213555999000",
        isOpen: true,
        isActive: true,
        status: "approved",
        isVerified: false,
        verifiedAt: null,
        approvedAt: new Date(Date.now() - 432e6),
        approvedBy: "admin-user",
        rejectionReason: null,
        createdAt: new Date(Date.now() - 432e6),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "store-8",
        userId: "amina-user",
        name: "\u0645\u0643\u062A\u0628\u0629 \u0627\u0644\u0645\u0639\u0631\u0641\u0629",
        description: "\u0645\u0643\u062A\u0628\u0629 \u0634\u0627\u0645\u0644\u0629 \u062A\u0636\u0645 \u0627\u0644\u0643\u062A\u0628 \u0648\u0627\u0644\u0642\u0631\u0637\u0627\u0633\u064A\u0629 \u0648\u0627\u0644\u0645\u0633\u062A\u0644\u0632\u0645\u0627\u062A \u0627\u0644\u0645\u062F\u0631\u0633\u064A\u0629",
        imageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
        category: "\u0643\u062A\u0628 \u0648\u0642\u0631\u0637\u0627\u0633\u064A\u0629",
        location: "\u0648\u0647\u0631\u0627\u0646",
        phoneNumber: "+213555333444",
        isOpen: true,
        isActive: false,
        status: "pending",
        isVerified: false,
        verifiedAt: null,
        approvedAt: null,
        approvedBy: null,
        rejectionReason: null,
        createdAt: new Date(Date.now() - 1296e6),
        updatedAt: /* @__PURE__ */ new Date()
      }
    ];
    mockStores.forEach((store) => {
      this.stores.set(store.id, store);
    });
    const mockVerificationRequests = [
      {
        id: randomUUID(),
        userId: "fatima-user",
        storeId: null,
        requestType: "user",
        status: "pending",
        documents: [],
        reason: "\u0623\u0631\u064A\u062F \u062A\u0648\u062B\u064A\u0642 \u062D\u0633\u0627\u0628\u064A \u0644\u0623\u0646\u0646\u064A \u062A\u0627\u062C\u0631\u0629 \u0645\u0639\u0631\u0648\u0641\u0629 \u0641\u064A \u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u0648\u0623\u0628\u064A\u0639 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u064A\u062F\u0648\u064A\u0629",
        adminNote: null,
        submittedAt: new Date(Date.now() - 36e5),
        // 1 hour ago
        reviewedAt: null,
        reviewedBy: null
      },
      {
        id: randomUUID(),
        userId: "yousef-user",
        storeId: null,
        requestType: "user",
        status: "pending",
        documents: [],
        reason: "\u0644\u062F\u064A \u062E\u0628\u0631\u0629 \u0637\u0648\u064A\u0644\u0629 \u0641\u064A \u0627\u0644\u062A\u062C\u0627\u0631\u0629 \u0648\u0623\u0631\u064A\u062F \u0627\u0644\u062D\u0635\u0648\u0644 \u0639\u0644\u0649 \u062A\u0648\u062B\u064A\u0642 \u0644\u0632\u064A\u0627\u062F\u0629 \u062B\u0642\u0629 \u0627\u0644\u0639\u0645\u0644\u0627\u0621",
        adminNote: null,
        submittedAt: new Date(Date.now() - 72e5),
        // 2 hours ago
        reviewedAt: null,
        reviewedBy: null
      },
      {
        id: randomUUID(),
        userId: "abdullah-user",
        storeId: null,
        requestType: "user",
        status: "pending",
        documents: [],
        reason: "\u0623\u0639\u0645\u0644 \u0641\u064A \u0645\u062C\u0627\u0644 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A \u0645\u0646\u0630 5 \u0633\u0646\u0648\u0627\u062A \u0648\u0623\u062D\u062A\u0627\u062C \u0627\u0644\u062A\u0648\u062B\u064A\u0642 \u0644\u0644\u0645\u0635\u062F\u0627\u0642\u064A\u0629",
        adminNote: null,
        submittedAt: new Date(Date.now() - 108e5),
        // 3 hours ago
        reviewedAt: null,
        reviewedBy: null
      }
    ];
    mockVerificationRequests.forEach((request) => {
      this.verificationRequests.set(request.id, request);
    });
    const mockStickers = [
      // General category
      {
        id: "sticker-1",
        name: "\u0627\u0628\u062A\u0633\u0627\u0645\u0629",
        imageUrl: "\u{1F60A}",
        category: "general",
        isActive: true,
        sortOrder: 1,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "sticker-2",
        name: "\u062D\u0632\u064A\u0646",
        imageUrl: "\u{1F622}",
        category: "general",
        isActive: true,
        sortOrder: 2,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "sticker-3",
        name: "\u062D\u0628",
        imageUrl: "\u2764\uFE0F",
        category: "general",
        isActive: true,
        sortOrder: 3,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "sticker-4",
        name: "\u0625\u0639\u062C\u0627\u0628",
        imageUrl: "\u{1F44D}",
        category: "general",
        isActive: true,
        sortOrder: 4,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "sticker-5",
        name: "\u0636\u062D\u0643",
        imageUrl: "\u{1F602}",
        category: "general",
        isActive: true,
        sortOrder: 5,
        createdAt: /* @__PURE__ */ new Date()
      },
      // Business category
      {
        id: "sticker-6",
        name: "\u0646\u062C\u0627\u062D",
        imageUrl: "\u{1F389}",
        category: "business",
        isActive: true,
        sortOrder: 6,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "sticker-7",
        name: "\u0623\u0645\u0648\u0627\u0644",
        imageUrl: "\u{1F4B0}",
        category: "business",
        isActive: true,
        sortOrder: 7,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "sticker-8",
        name: "\u0635\u0641\u0642\u0629",
        imageUrl: "\u{1F91D}",
        category: "business",
        isActive: true,
        sortOrder: 8,
        createdAt: /* @__PURE__ */ new Date()
      }
    ];
    mockStickers.forEach((sticker) => {
      this.stickers.set(sticker.id, sticker);
    });
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByPhoneNumber(phoneNumber) {
    return Array.from(this.users.values()).find(
      (user) => user.phoneNumber === phoneNumber
    );
  }
  async createUser(insertUser) {
    const id = randomUUID();
    const user = {
      ...insertUser,
      id,
      avatar: insertUser.avatar ?? null,
      isOnline: insertUser.isOnline ?? false,
      isVerified: false,
      // New users start unverified
      verifiedAt: null,
      // No verification date until verified
      isAdmin: false,
      // New users start as non-admin
      lastSeen: /* @__PURE__ */ new Date(),
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.users.set(id, user);
    return user;
  }
  async updateUserOnlineStatus(id, isOnline) {
    const user = this.users.get(id);
    if (user) {
      user.isOnline = isOnline;
      user.lastSeen = /* @__PURE__ */ new Date();
      this.users.set(id, user);
    }
  }
  async updateUser(id, userData) {
    const user = this.users.get(id);
    if (!user) return void 0;
    const updatedUser = {
      ...user,
      ...userData,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  async deleteUser(userId) {
    try {
      this.users.delete(userId);
      this.stores.forEach((store, storeId) => {
        if (store.userId === userId) {
          this.stores.delete(storeId);
        }
      });
      this.products.forEach((product, productId) => {
        if (product.userId === userId) {
          this.products.delete(productId);
        }
      });
      this.orders.forEach((order, orderId) => {
        if (order.buyerId === userId) {
          this.orders.delete(orderId);
        }
      });
      this.verificationRequests.forEach((req, reqId) => {
        if (req.userId === userId) {
          this.verificationRequests.delete(reqId);
        }
      });
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }
  async getChat(id) {
    return this.chats.get(id);
  }
  async getUserChats(userId) {
    return Array.from(this.chats.values()).filter(
      (chat) => chat.participants.includes(userId)
    ).sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));
  }
  async createChat(insertChat) {
    const id = randomUUID();
    const chat = {
      ...insertChat,
      id,
      name: insertChat.name ?? null,
      avatar: insertChat.avatar ?? null,
      isGroup: insertChat.isGroup ?? false,
      participants: [...insertChat.participants],
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.chats.set(id, chat);
    return chat;
  }
  async deleteChat(id) {
    const chat = this.chats.get(id);
    if (!chat) return false;
    const messagesToDelete = Array.from(this.messages.values()).filter((message) => message.chatId === id);
    messagesToDelete.forEach((message) => {
      this.messages.delete(message.id);
    });
    this.chats.delete(id);
    return true;
  }
  async getChatMessages(chatId) {
    return Array.from(this.messages.values()).filter((message) => message.chatId === chatId).sort((a, b) => (a.timestamp?.getTime() ?? 0) - (b.timestamp?.getTime() ?? 0));
  }
  async createMessage(insertMessage) {
    const id = randomUUID();
    const message = {
      ...insertMessage,
      id,
      content: insertMessage.content ?? null,
      messageType: insertMessage.messageType ?? "text",
      imageUrl: insertMessage.imageUrl ?? null,
      audioUrl: insertMessage.audioUrl ?? null,
      stickerUrl: insertMessage.stickerUrl ?? null,
      stickerId: insertMessage.stickerId ?? null,
      locationLat: insertMessage.locationLat ?? null,
      locationLon: insertMessage.locationLon ?? null,
      locationName: insertMessage.locationName ?? null,
      replyToMessageId: insertMessage.replyToMessageId ?? null,
      timestamp: /* @__PURE__ */ new Date(),
      isRead: false,
      isDelivered: true,
      isEdited: false,
      editedAt: null,
      deletedAt: null
    };
    this.messages.set(id, message);
    const chat = this.chats.get(insertMessage.chatId);
    if (chat) {
      chat.updatedAt = /* @__PURE__ */ new Date();
      this.chats.set(chat.id, chat);
    }
    return message;
  }
  async markMessageAsRead(messageId) {
    const message = this.messages.get(messageId);
    if (message) {
      message.isRead = true;
      this.messages.set(messageId, message);
    }
  }
  async markMessageAsDelivered(messageId) {
    const message = this.messages.get(messageId);
    if (message) {
      message.isDelivered = true;
      this.messages.set(messageId, message);
    }
  }
  async searchMessages(chatId, searchTerm) {
    return Array.from(this.messages.values()).filter(
      (message) => message.chatId === chatId && message.deletedAt === null && message.content && message.content.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => (a.timestamp?.getTime() ?? 0) - (b.timestamp?.getTime() ?? 0));
  }
  async updateMessage(messageId, content) {
    const message = this.messages.get(messageId);
    if (message && message.deletedAt === null) {
      message.content = content;
      message.isEdited = true;
      message.editedAt = /* @__PURE__ */ new Date();
      this.messages.set(messageId, message);
      return message;
    }
    return void 0;
  }
  async deleteMessage(messageId) {
    const message = this.messages.get(messageId);
    if (message) {
      message.deletedAt = /* @__PURE__ */ new Date();
      this.messages.set(messageId, message);
    }
  }
  // Stories methods - filtered by user location
  async getActiveStories() {
    const currentUser = await this.getUser("current-user");
    if (!currentUser) return [];
    const now = /* @__PURE__ */ new Date();
    const activeStories = Array.from(this.stories.values()).filter(
      (story) => story.expiresAt && story.expiresAt > now && story.location === currentUser.location
      // Filter by location
    ).sort((a, b) => (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0));
    const storiesWithUsers = await Promise.all(
      activeStories.map(async (story) => {
        const user = await this.getUser(story.userId);
        return {
          ...story,
          user
        };
      })
    );
    return storiesWithUsers;
  }
  async getUserStories(userId) {
    const now = /* @__PURE__ */ new Date();
    return Array.from(this.stories.values()).filter((story) => story.userId === userId && story.expiresAt && story.expiresAt > now).sort((a, b) => (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0));
  }
  async createStory(insertStory) {
    const id = randomUUID();
    const story = {
      ...insertStory,
      id,
      content: insertStory.content ?? null,
      imageUrl: insertStory.imageUrl ?? null,
      videoUrl: insertStory.videoUrl ?? null,
      backgroundColor: insertStory.backgroundColor ?? null,
      textColor: insertStory.textColor ?? null,
      timestamp: /* @__PURE__ */ new Date(),
      viewCount: "0",
      viewers: insertStory.viewers ?? []
    };
    this.stories.set(id, story);
    return story;
  }
  async viewStory(storyId, viewerId) {
    const story = this.stories.get(storyId);
    if (story) {
      const viewers = story.viewers ?? [];
      if (!viewers.includes(viewerId)) {
        story.viewers = [...viewers, viewerId];
        story.viewCount = String(parseInt(story.viewCount ?? "0") + 1);
        this.stories.set(storyId, story);
      }
    }
  }
  async getStory(storyId) {
    return this.stories.get(storyId);
  }
  // Authentication methods
  async createOtpCode(insertOtp) {
    const id = randomUUID();
    const otp = {
      ...insertOtp,
      id,
      isUsed: false,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.otpCodes.set(id, otp);
    return otp;
  }
  async verifyOtpCode(phoneNumber, code) {
    const otp = Array.from(this.otpCodes.values()).find(
      (otp2) => otp2.phoneNumber === phoneNumber && otp2.code === code && !otp2.isUsed && otp2.expiresAt > /* @__PURE__ */ new Date()
    );
    if (otp) {
      otp.isUsed = true;
      this.otpCodes.set(otp.id, otp);
      return true;
    }
    return false;
  }
  async createSession(insertSession) {
    const id = randomUUID();
    const session = {
      ...insertSession,
      id,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.sessions.set(session.token, session);
    return session;
  }
  async getSessionByToken(token) {
    const session = this.sessions.get(token);
    if (session && session.expiresAt > /* @__PURE__ */ new Date()) {
      return session;
    }
    return void 0;
  }
  async deleteSession(token) {
    this.sessions.delete(token);
  }
  // Products methods
  // Store methods
  async getStores(location, category) {
    let stores2 = Array.from(this.stores.values()).filter((s) => s.isActive && s.status === "approved");
    if (location) {
      stores2 = stores2.filter((s) => s.location === location);
    }
    if (category) {
      stores2 = stores2.filter((s) => s.category === category);
    }
    const storesWithOwners = await Promise.all(
      stores2.map(async (store) => {
        const owner = await this.getUser(store.userId);
        return {
          ...store,
          owner
        };
      })
    );
    return storesWithOwners.sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));
  }
  async getStore(id) {
    return this.stores.get(id);
  }
  async getUserStore(userId) {
    return Array.from(this.stores.values()).find((s) => s.userId === userId);
  }
  async createStore(insertStore) {
    const id = randomUUID();
    const store = {
      ...insertStore,
      id,
      imageUrl: insertStore.imageUrl ?? null,
      phoneNumber: insertStore.phoneNumber ?? null,
      isOpen: insertStore.isOpen ?? true,
      isActive: false,
      // Start inactive until approved
      status: "pending",
      // Default status is pending approval
      isVerified: false,
      // New stores start unverified
      verifiedAt: null,
      // No verification date until verified
      approvedAt: null,
      // No approval date until approved
      approvedBy: null,
      // No approver until approved
      rejectionReason: null,
      // No rejection reason initially
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.stores.set(id, store);
    return store;
  }
  async updateStore(id, updateData) {
    const store = this.stores.get(id);
    if (!store) return void 0;
    const updatedStore = {
      ...store,
      ...updateData,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.stores.set(id, updatedStore);
    return updatedStore;
  }
  async deleteStore(id) {
    const store = this.stores.get(id);
    if (!store) return false;
    const updatedStore = {
      ...store,
      isActive: false,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.stores.set(id, updatedStore);
    return true;
  }
  async getStoreProducts(storeId) {
    return Array.from(this.products.values()).filter((p) => p.storeId === storeId && p.isActive).sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));
  }
  async getProducts(location, category) {
    let products2 = Array.from(this.products.values()).filter((p) => p.isActive);
    if (location) {
      products2 = products2.filter((p) => p.location === location);
    }
    if (category) {
      products2 = products2.filter((p) => p.category === category);
    }
    const productsWithOwners = await Promise.all(
      products2.map(async (product) => {
        const owner = await this.getUser(product.userId);
        return {
          ...product,
          owner
        };
      })
    );
    return productsWithOwners.sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));
  }
  async getProduct(id) {
    const product = this.products.get(id);
    if (!product) return void 0;
    const owner = await this.getUser(product.userId);
    if (!owner) return void 0;
    return {
      ...product,
      owner
    };
  }
  async getUserProducts(userId) {
    return Array.from(this.products.values()).filter((p) => p.userId === userId).sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));
  }
  async createProduct(insertProduct) {
    const id = randomUUID();
    const product = {
      ...insertProduct,
      id,
      storeId: insertProduct.storeId ?? null,
      imageUrl: insertProduct.imageUrl ?? null,
      isActive: insertProduct.isActive ?? true,
      commissionRate: insertProduct.commissionRate ?? "0.05",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.products.set(id, product);
    return product;
  }
  async updateProduct(id, updateData) {
    const product = this.products.get(id);
    if (!product) return void 0;
    const updatedProduct = {
      ...product,
      ...updateData,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }
  async deleteProduct(id) {
    return this.products.delete(id);
  }
  // Affiliate Links methods
  async createAffiliateLink(insertAffiliateLink) {
    const id = randomUUID();
    const uniqueCode = `AFF${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const affiliateLink = {
      ...insertAffiliateLink,
      id,
      uniqueCode,
      clicks: "0",
      conversions: "0",
      totalCommission: "0",
      createdAt: /* @__PURE__ */ new Date()
    };
    this.affiliateLinks.set(id, affiliateLink);
    return affiliateLink;
  }
  async getAffiliateLink(uniqueCode) {
    return Array.from(this.affiliateLinks.values()).find((link) => link.uniqueCode === uniqueCode);
  }
  async getUserAffiliateLinks(userId) {
    const userLinks = Array.from(this.affiliateLinks.values()).filter((link) => link.affiliateId === userId);
    const linksWithProducts = await Promise.all(
      userLinks.map(async (link) => {
        const product = await this.getProduct(link.productId);
        return {
          ...link,
          product
        };
      })
    );
    return linksWithProducts.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }
  async trackClick(uniqueCode) {
    const link = await this.getAffiliateLink(uniqueCode);
    if (link) {
      const currentClicks = parseInt(link.clicks ?? "0");
      link.clicks = String(currentClicks + 1);
      this.affiliateLinks.set(link.id, link);
    }
  }
  async trackConversion(uniqueCode, buyerId, amount) {
    const link = await this.getAffiliateLink(uniqueCode);
    if (!link) throw new Error("Affiliate link not found");
    const currentConversions = parseInt(link.conversions ?? "0");
    const currentTotalCommission = parseFloat(link.totalCommission ?? "0");
    link.conversions = String(currentConversions + 1);
    link.totalCommission = String(currentTotalCommission + parseFloat(amount));
    this.affiliateLinks.set(link.id, link);
    const commissionId = randomUUID();
    const commission = {
      id: commissionId,
      affiliateLinkId: link.id,
      buyerId,
      amount,
      status: "pending",
      transactionId: null,
      createdAt: /* @__PURE__ */ new Date(),
      paidAt: null
    };
    this.commissions.set(commissionId, commission);
    return commission;
  }
  // Commissions methods
  async getUserCommissions(userId) {
    const userLinks = Array.from(this.affiliateLinks.values()).filter((link) => link.affiliateId === userId);
    const commissions2 = Array.from(this.commissions.values()).filter((commission) => userLinks.some((link) => link.id === commission.affiliateLinkId));
    const commissionsWithDetails = await Promise.all(
      commissions2.map(async (commission) => {
        const affiliateLink = userLinks.find((link) => link.id === commission.affiliateLinkId);
        const product = await this.getProduct(affiliateLink.productId);
        return {
          ...commission,
          affiliateLink: {
            ...affiliateLink,
            product
          }
        };
      })
    );
    return commissionsWithDetails.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }
  async getTotalCommissions(userId) {
    const commissions2 = await this.getUserCommissions(userId);
    const total = commissions2.filter((c) => c.status === "paid").reduce((sum, commission) => sum + parseFloat(commission.amount), 0);
    return total.toString();
  }
  async getCommissionsByStatus(userId, status) {
    const userCommissions = await this.getUserCommissions(userId);
    return userCommissions.filter((c) => c.status === status).map((c) => ({
      id: c.id,
      affiliateLinkId: c.affiliateLinkId,
      buyerId: c.buyerId,
      amount: c.amount,
      status: c.status,
      transactionId: c.transactionId,
      createdAt: c.createdAt,
      paidAt: c.paidAt
    }));
  }
  // Contacts methods
  async getUserContacts(userId) {
    const userContacts = Array.from(this.contacts.values()).filter((contact) => contact.userId === userId);
    const contactsWithUsers = await Promise.all(
      userContacts.map(async (contact) => {
        let user = void 0;
        if (contact.contactUserId) {
          user = await this.getUser(contact.contactUserId);
        }
        return {
          ...contact,
          user
        };
      })
    );
    return contactsWithUsers.sort((a, b) => a.name.localeCompare(b.name));
  }
  async addContact(insertContact) {
    const id = randomUUID();
    const existingUser = await this.getUserByPhoneNumber(insertContact.phoneNumber);
    const contact = {
      ...insertContact,
      id,
      contactUserId: existingUser?.id || null,
      isAppUser: !!existingUser,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.contacts.set(id, contact);
    return contact;
  }
  async searchUserByPhoneNumber(phoneNumber) {
    return this.getUserByPhoneNumber(phoneNumber);
  }
  async updateContactAppUser(contactId, contactUserId) {
    const contact = this.contacts.get(contactId);
    if (contact) {
      contact.contactUserId = contactUserId;
      contact.isAppUser = true;
      this.contacts.set(contactId, contact);
    }
  }
  // Shopping Cart methods
  async getCartItems(userId) {
    const userCartItems = Array.from(this.cartItems.values()).filter((item) => item.userId === userId);
    const itemsWithProducts = await Promise.all(
      userCartItems.map(async (item) => {
        const product = await this.getProduct(item.productId);
        const owner = await this.getUser(product.userId);
        return {
          ...item,
          product: {
            ...product,
            owner
          }
        };
      })
    );
    return itemsWithProducts.sort((a, b) => (b.addedAt?.getTime() ?? 0) - (a.addedAt?.getTime() ?? 0));
  }
  async addToCart(insertCartItem) {
    const existingItem = Array.from(this.cartItems.values()).find((item) => item.userId === insertCartItem.userId && item.productId === insertCartItem.productId);
    if (existingItem) {
      const newQuantity = parseInt(existingItem.quantity) + parseInt(insertCartItem.quantity || "1");
      existingItem.quantity = newQuantity.toString();
      this.cartItems.set(existingItem.id, existingItem);
      return existingItem;
    }
    const id = randomUUID();
    const cartItem = {
      ...insertCartItem,
      id,
      quantity: insertCartItem.quantity || "1",
      addedAt: /* @__PURE__ */ new Date()
    };
    this.cartItems.set(id, cartItem);
    return cartItem;
  }
  async updateCartItemQuantity(userId, productId, quantity) {
    const item = Array.from(this.cartItems.values()).find((item2) => item2.userId === userId && item2.productId === productId);
    if (item) {
      item.quantity = quantity;
      this.cartItems.set(item.id, item);
    }
  }
  async removeFromCart(userId, productId) {
    const item = Array.from(this.cartItems.values()).find((item2) => item2.userId === userId && item2.productId === productId);
    if (item) {
      this.cartItems.delete(item.id);
    }
  }
  async clearCart(userId) {
    const userCartItems = Array.from(this.cartItems.entries()).filter(([_, item]) => item.userId === userId);
    userCartItems.forEach(([id, _]) => {
      this.cartItems.delete(id);
    });
  }
  // Orders methods
  async createOrder(insertOrder, items) {
    const orderId = randomUUID();
    const order = {
      ...insertOrder,
      id: orderId,
      status: insertOrder.status || "pending",
      storeId: insertOrder.storeId || null,
      paymentMethod: insertOrder.paymentMethod || "cash_on_delivery",
      notes: insertOrder.notes || null,
      cancellationReason: insertOrder.cancellationReason || null,
      orderDate: /* @__PURE__ */ new Date(),
      confirmedAt: null,
      deliveredAt: null,
      cancelledAt: null
    };
    this.orders.set(orderId, order);
    items.forEach((insertItem) => {
      const itemId = randomUUID();
      const orderItem = {
        ...insertItem,
        id: itemId,
        orderId
      };
      this.orderItems.set(itemId, orderItem);
    });
    return order;
  }
  async getUserOrders(userId) {
    const userOrders = Array.from(this.orders.values()).filter((order) => order.buyerId === userId);
    const ordersWithDetails = await Promise.all(
      userOrders.map(async (order) => {
        const items = Array.from(this.orderItems.values()).filter((item) => item.orderId === order.id);
        const itemsWithProducts = await Promise.all(
          items.map(async (item) => {
            const product = await this.getProduct(item.productId);
            return {
              ...item,
              product
            };
          })
        );
        const seller = await this.getUser(order.sellerId);
        return {
          ...order,
          items: itemsWithProducts,
          seller
        };
      })
    );
    return ordersWithDetails.sort((a, b) => (b.orderDate?.getTime() ?? 0) - (a.orderDate?.getTime() ?? 0));
  }
  async getSellerOrders(sellerId) {
    const sellerOrders = Array.from(this.orders.values()).filter((order) => order.sellerId === sellerId);
    const ordersWithDetails = await Promise.all(
      sellerOrders.map(async (order) => {
        const items = Array.from(this.orderItems.values()).filter((item) => item.orderId === order.id);
        const itemsWithProducts = await Promise.all(
          items.map(async (item) => {
            const product = await this.getProduct(item.productId);
            return {
              ...item,
              product
            };
          })
        );
        const buyer = await this.getUser(order.buyerId);
        return {
          ...order,
          items: itemsWithProducts,
          buyer
        };
      })
    );
    return ordersWithDetails.sort((a, b) => (b.orderDate?.getTime() ?? 0) - (a.orderDate?.getTime() ?? 0));
  }
  async getOrder(orderId) {
    const order = this.orders.get(orderId);
    if (!order) return void 0;
    const items = Array.from(this.orderItems.values()).filter((item) => item.orderId === orderId);
    const itemsWithProducts = await Promise.all(
      items.map(async (item) => {
        const product = await this.getProduct(item.productId);
        return {
          ...item,
          product
        };
      })
    );
    const seller = await this.getUser(order.sellerId);
    const buyer = await this.getUser(order.buyerId);
    return {
      ...order,
      items: itemsWithProducts,
      seller,
      buyer
    };
  }
  async updateOrderStatus(orderId, status, updatedBy) {
    const order = this.orders.get(orderId);
    if (!order) return void 0;
    order.status = status;
    const now = /* @__PURE__ */ new Date();
    switch (status) {
      case "confirmed":
        order.confirmedAt = now;
        break;
      case "delivered":
        order.deliveredAt = now;
        break;
      case "cancelled":
        order.cancelledAt = now;
        break;
    }
    this.orders.set(orderId, order);
    return order;
  }
  async cancelOrder(orderId, reason) {
    const order = this.orders.get(orderId);
    if (!order) return void 0;
    order.status = "cancelled";
    order.cancelledAt = /* @__PURE__ */ new Date();
    order.cancellationReason = reason;
    this.orders.set(orderId, order);
    return order;
  }
  // Verification Requests
  async createVerificationRequest(request) {
    const id = randomUUID();
    const verificationRequest = {
      id,
      userId: request.userId,
      storeId: request.storeId || null,
      requestType: request.requestType,
      status: request.status || "pending",
      documents: request.documents || [],
      reason: request.reason || null,
      adminNote: request.adminNote || null,
      submittedAt: /* @__PURE__ */ new Date(),
      reviewedAt: null,
      reviewedBy: null
    };
    this.verificationRequests.set(id, verificationRequest);
    return verificationRequest;
  }
  async getUserVerificationRequests(userId) {
    return Array.from(this.verificationRequests.values()).filter((request) => request.userId === userId).sort((a, b) => (b.submittedAt?.getTime() ?? 0) - (a.submittedAt?.getTime() ?? 0));
  }
  async getVerificationRequest(id) {
    return this.verificationRequests.get(id);
  }
  async updateVerificationRequestStatus(id, status, reviewedBy, adminNote) {
    const request = this.verificationRequests.get(id);
    if (!request) return void 0;
    request.status = status;
    request.adminNote = adminNote || null;
    request.reviewedBy = reviewedBy || null;
    request.reviewedAt = /* @__PURE__ */ new Date();
    if (status === "approved" && request.requestType === "user") {
      const user = this.users.get(request.userId);
      if (user) {
        user.isVerified = true;
        user.verifiedAt = /* @__PURE__ */ new Date();
        this.users.set(request.userId, user);
      }
    }
    this.verificationRequests.set(id, request);
    return request;
  }
  // ======================
  // ADMIN FUNCTIONS
  // ======================
  async getUserById(id) {
    return this.users.get(id);
  }
  async getAllUsers() {
    return Array.from(this.users.values());
  }
  async getAllVerificationRequests(status) {
    let requests = Array.from(this.verificationRequests.values());
    if (status) {
      requests = requests.filter((request) => request.status === status);
    }
    return requests.sort((a, b) => (b.submittedAt?.getTime() ?? 0) - (a.submittedAt?.getTime() ?? 0));
  }
  async updateUserAdminStatus(userId, isAdmin) {
    const user = this.users.get(userId);
    if (!user) return void 0;
    user.isAdmin = isAdmin;
    this.users.set(userId, user);
    return user;
  }
  async updateUserVerificationStatus(userId, isVerified) {
    const user = this.users.get(userId);
    if (!user) return void 0;
    user.isVerified = isVerified;
    user.verifiedAt = isVerified ? /* @__PURE__ */ new Date() : null;
    this.users.set(userId, user);
    return user;
  }
  async getAllStores() {
    return Array.from(this.stores.values());
  }
  async updateStoreStatus(storeId, status, adminId, rejectionReason) {
    const store = this.stores.get(storeId);
    if (!store) return void 0;
    const updatedStore = {
      ...store,
      status,
      isActive: status === "approved",
      // Only active if approved
      approvedAt: status === "approved" ? /* @__PURE__ */ new Date() : store.approvedAt,
      approvedBy: status === "approved" && adminId ? adminId : store.approvedBy,
      rejectionReason: status === "rejected" ? rejectionReason || null : null,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.stores.set(storeId, updatedStore);
    return updatedStore;
  }
  async getAllOrders() {
    return Array.from(this.orders.values());
  }
  async getAdminDashboardStats() {
    const users2 = Array.from(this.users.values());
    const stores2 = Array.from(this.stores.values());
    const orders2 = Array.from(this.orders.values());
    const verificationRequests2 = Array.from(this.verificationRequests.values());
    const now = /* @__PURE__ */ new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1e3);
    const totalRevenue = orders2.filter((order) => order.status === "delivered").reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
    const recentOrders = orders2.filter(
      (order) => order.orderDate && order.orderDate >= last24Hours
    ).length;
    const activeUsers = users2.filter(
      (user) => user.lastSeen && user.lastSeen >= last24Hours
    ).length;
    const verifiedUsers = users2.filter((user) => user.isVerified).length;
    const pendingVerifications = verificationRequests2.filter(
      (request) => request.status === "pending"
    ).length;
    return {
      totalUsers: users2.length,
      totalStores: stores2.length,
      totalOrders: orders2.length,
      pendingVerifications,
      recentOrders,
      totalRevenue: totalRevenue.toFixed(2),
      activeUsers,
      verifiedUsers
    };
  }
  // Story Likes Implementation
  async likeStory(storyId, userId, reactionType = "like") {
    const existingLike = Array.from(this.storyLikes.values()).find(
      (like) => like.storyId === storyId && like.userId === userId
    );
    if (existingLike) {
      this.storyLikes.delete(existingLike.id);
    }
    const newLike = {
      id: randomUUID(),
      storyId,
      userId,
      reactionType,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.storyLikes.set(newLike.id, newLike);
    return newLike;
  }
  async unlikeStory(storyId, userId) {
    const existingLike = Array.from(this.storyLikes.values()).find(
      (like) => like.storyId === storyId && like.userId === userId
    );
    if (existingLike) {
      this.storyLikes.delete(existingLike.id);
    }
  }
  async getStoryLikes(storyId) {
    const likes = Array.from(this.storyLikes.values()).filter((like) => like.storyId === storyId);
    return likes.map((like) => ({
      ...like,
      user: this.users.get(like.userId)
    })).filter((like) => like.user);
  }
  async getStoryLikeCount(storyId) {
    return Array.from(this.storyLikes.values()).filter((like) => like.storyId === storyId).length;
  }
  async hasUserLikedStory(storyId, userId) {
    return Array.from(this.storyLikes.values()).some((like) => like.storyId === storyId && like.userId === userId);
  }
  // Story Comments Implementation
  async addStoryComment(comment) {
    const newComment = {
      id: randomUUID(),
      ...comment,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.storyComments.set(newComment.id, newComment);
    return newComment;
  }
  async getStoryComments(storyId) {
    const comments = Array.from(this.storyComments.values()).filter((comment) => comment.storyId === storyId).sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0));
    return comments.map((comment) => ({
      ...comment,
      user: this.users.get(comment.userId)
    })).filter((comment) => comment.user);
  }
  async updateStoryComment(commentId, content) {
    const comment = this.storyComments.get(commentId);
    if (!comment) return void 0;
    comment.content = content;
    comment.updatedAt = /* @__PURE__ */ new Date();
    this.storyComments.set(commentId, comment);
    return comment;
  }
  async deleteStoryComment(commentId) {
    this.storyComments.delete(commentId);
  }
  async getStoryCommentCount(storyId) {
    return Array.from(this.storyComments.values()).filter((comment) => comment.storyId === storyId).length;
  }
  // Stickers Implementation
  async getAllStickers() {
    return Array.from(this.stickers.values()).filter((sticker) => sticker.isActive).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }
  async getStickersByCategory(category) {
    return Array.from(this.stickers.values()).filter((sticker) => sticker.isActive && sticker.category === category).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }
  async getSticker(id) {
    return this.stickers.get(id);
  }
  async createSticker(insertSticker) {
    const id = randomUUID();
    const sticker = {
      ...insertSticker,
      id,
      category: insertSticker.category || "general",
      isActive: insertSticker.isActive ?? true,
      sortOrder: insertSticker.sortOrder ?? 0,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.stickers.set(id, sticker);
    return sticker;
  }
  // Admin Credentials Implementation
  async getAdminCredentials() {
    try {
      const result = await db2.select().from(adminCredentials).where(eq(adminCredentials.id, "admin_settings")).limit(1);
      return result[0] || void 0;
    } catch (error) {
      console.error("Error getting admin credentials:", error);
      return this.adminCredentials;
    }
  }
  async updateAdminCredentials(credentials) {
    try {
      const adminCreds = {
        id: "admin_settings",
        email: credentials.email,
        password: credentials.password,
        updatedAt: /* @__PURE__ */ new Date(),
        createdAt: /* @__PURE__ */ new Date()
      };
      const result = await db2.insert(adminCredentials).values(adminCreds).onConflictDoUpdate({
        target: adminCredentials.id,
        set: {
          email: credentials.email,
          password: credentials.password,
          updatedAt: /* @__PURE__ */ new Date()
        }
      }).returning();
      this.adminCredentials = result[0];
      return result[0];
    } catch (error) {
      console.error("Error updating admin credentials:", error);
      const adminCreds = {
        id: "admin_settings",
        email: credentials.email,
        password: credentials.password,
        createdAt: this.adminCredentials?.createdAt || /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
      this.adminCredentials = adminCreds;
      return adminCreds;
    }
  }
  // Feature Management Methods
  async getAllFeatures() {
    try {
      const result = await db2.select().from(appFeatures).orderBy(appFeatures.category, appFeatures.priority);
      return result;
    } catch (error) {
      console.error("Error getting features:", error);
      return Array.from(this.features.values());
    }
  }
  async getFeature(featureId) {
    try {
      const result = await db2.select().from(appFeatures).where(eq(appFeatures.id, featureId)).limit(1);
      return result[0] || void 0;
    } catch (error) {
      console.error("Error getting feature:", error);
      return this.features.get(featureId);
    }
  }
  async updateFeature(featureId, updates) {
    try {
      const result = await db2.update(appFeatures).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(appFeatures.id, featureId)).returning();
      if (result[0]) {
        this.features.set(featureId, result[0]);
        return result[0];
      }
      return void 0;
    } catch (error) {
      console.error("Error updating feature:", error);
      const feature = this.features.get(featureId);
      if (feature) {
        const updatedFeature = { ...feature, ...updates, updatedAt: /* @__PURE__ */ new Date() };
        this.features.set(featureId, updatedFeature);
        return updatedFeature;
      }
      return void 0;
    }
  }
  async initializeDefaultFeatures() {
    const defaultFeatures = [
      {
        id: "messaging",
        name: "\u0627\u0644\u0645\u0631\u0627\u0633\u0644\u0629",
        description: "\u0627\u0644\u062F\u0631\u062F\u0634\u0627\u062A \u0627\u0644\u0641\u0631\u062F\u064A\u0629 \u0648\u0627\u0644\u062C\u0645\u0627\u0639\u064A\u0629 \u0645\u0639 \u0627\u0644\u0631\u0633\u0627\u0626\u0644 \u0627\u0644\u0646\u0635\u064A\u0629 \u0648\u0627\u0644\u0635\u0648\u062A\u064A\u0629 \u0648\u0627\u0644\u0645\u0644\u0641\u0627\u062A",
        isEnabled: true,
        category: "communication",
        priority: 1
      },
      {
        id: "stories",
        name: "\u0627\u0644\u062D\u0627\u0644\u0627\u062A/\u0627\u0644\u0642\u0635\u0635",
        description: "\u0627\u0646\u0634\u0631 \u0645\u0646\u062A\u062C\u0643 \u0648\u0645\u0634\u0627\u0647\u062F\u0629 \u062D\u0627\u0644\u0627\u062A \u0627\u0644\u0622\u062E\u0631\u064A\u0646 \u0644\u0645\u062F\u0629 24 \u0633\u0627\u0639\u0629",
        isEnabled: true,
        category: "social",
        priority: 2
      },
      {
        id: "marketplace",
        name: "\u0627\u0644\u0645\u062A\u0627\u062C\u0631",
        description: "\u062A\u0635\u0641\u062D \u0627\u0644\u0645\u062A\u0627\u062C\u0631 \u0648\u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0641\u064A \u0645\u0646\u0637\u0642\u062A\u0643",
        isEnabled: true,
        category: "commerce",
        priority: 3
      },
      {
        id: "products",
        name: "\u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A",
        description: "\u0639\u0631\u0636 \u0648\u0628\u064A\u0639 \u0645\u0646\u062A\u062C\u0627\u062A\u0643 \u0641\u064A \u0627\u0644\u0633\u0648\u0642 \u0627\u0644\u0645\u062D\u0644\u064A",
        isEnabled: true,
        category: "commerce",
        priority: 4
      },
      {
        id: "cart",
        name: "\u0633\u0644\u0629 \u0627\u0644\u062A\u0633\u0648\u0642",
        description: "\u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0648\u0625\u062C\u0631\u0627\u0621 \u0639\u0645\u0644\u064A\u0627\u062A \u0627\u0644\u0634\u0631\u0627\u0621",
        isEnabled: true,
        category: "commerce",
        priority: 5
      },
      {
        id: "orders",
        name: "\u0627\u0644\u0637\u0644\u0628\u0627\u062A",
        description: "\u0645\u062A\u0627\u0628\u0639\u0629 \u0637\u0644\u0628\u0627\u062A\u0643 \u0648\u0645\u0628\u064A\u0639\u0627\u062A\u0643",
        isEnabled: true,
        category: "commerce",
        priority: 6
      },
      {
        id: "affiliate",
        name: "\u0627\u0644\u062A\u0633\u0648\u064A\u0642 \u0628\u0627\u0644\u0639\u0645\u0648\u0644\u0629",
        description: "\u0631\u0628\u062D \u0639\u0645\u0648\u0644\u0629 \u0645\u0646 \u062E\u0644\u0627\u0644 \u0645\u0634\u0627\u0631\u0643\u0629 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A",
        isEnabled: true,
        category: "monetization",
        priority: 7
      },
      {
        id: "contacts",
        name: "\u062C\u0647\u0627\u062A \u0627\u0644\u0627\u062A\u0635\u0627\u0644",
        description: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0623\u0635\u062F\u0642\u0627\u0621 \u0648\u062C\u0647\u0627\u062A \u0627\u0644\u0627\u062A\u0635\u0627\u0644",
        isEnabled: true,
        category: "communication",
        priority: 8
      },
      {
        id: "profile",
        name: "\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A",
        description: "\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0648\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0634\u062E\u0635\u064A\u0629",
        isEnabled: true,
        category: "account",
        priority: 9
      }
    ];
    try {
      if (process.env.DATABASE_URL && !db2) {
        const dbModule = await Promise.resolve().then(() => (init_db(), db_exports));
        db2 = dbModule.db;
      }
      if (db2) {
        const existingFeatures = await db2.select().from(appFeatures);
        if (existingFeatures.length === 0) {
          await db2.insert(appFeatures).values(defaultFeatures);
          console.log("Default features initialized in database");
        }
        const allFeatures = await db2.select().from(appFeatures);
        allFeatures.forEach((feature) => {
          this.features.set(feature.id, feature);
        });
      } else {
        throw new Error("Database not available");
      }
    } catch (error) {
      console.error("Error initializing features in database, using memory fallback:", error);
      defaultFeatures.forEach((feature) => {
        const fullFeature = {
          ...feature,
          category: feature.category || "general",
          isEnabled: feature.isEnabled ?? true,
          priority: feature.priority ?? 0,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.features.set(feature.id, fullFeature);
      });
    }
  }
};
var DatabaseStorage = class {
  otpCodes = /* @__PURE__ */ new Map();
  async getUser(id) {
    try {
      if (!db2) {
        const dbModule = await Promise.resolve().then(() => (init_db(), db_exports));
        db2 = dbModule.db;
      }
      const [user] = await db2.select().from(users).where(eq(users.id, id));
      return user || void 0;
    } catch (error) {
      console.error("Error getting user:", error);
      return void 0;
    }
  }
  async getUserByPhoneNumber(phoneNumber) {
    try {
      if (!db2) {
        const dbModule = await Promise.resolve().then(() => (init_db(), db_exports));
        db2 = dbModule.db;
      }
      const [user] = await db2.select().from(users).where(eq(users.phoneNumber, phoneNumber));
      return user || void 0;
    } catch (error) {
      console.error("Error getting user by phone:", error);
      return void 0;
    }
  }
  async createUser(insertUser) {
    try {
      if (!db2) {
        const dbModule = await Promise.resolve().then(() => (init_db(), db_exports));
        db2 = dbModule.db;
      }
      const [user] = await db2.insert(users).values(insertUser).returning();
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }
  async updateUser(id, userData) {
    try {
      if (!db2) {
        const dbModule = await Promise.resolve().then(() => (init_db(), db_exports));
        db2 = dbModule.db;
      }
      const [user] = await db2.update(users).set({
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(users.id, id)).returning();
      return user || void 0;
    } catch (error) {
      console.error("Error updating user:", error);
      return void 0;
    }
  }
  async updateUserOnlineStatus(id, isOnline) {
    try {
      if (!db2) {
        const dbModule = await Promise.resolve().then(() => (init_db(), db_exports));
        db2 = dbModule.db;
      }
      await db2.update(users).set({
        isOnline,
        lastSeen: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(users.id, id));
    } catch (error) {
      console.error("Error updating user online status:", error);
    }
  }
  async deleteUser(userId) {
    try {
      if (!db2) {
        const dbModule = await Promise.resolve().then(() => (init_db(), db_exports));
        db2 = dbModule.db;
      }
      await db2.delete(sessions).where(eq(sessions.userId, userId));
      const userInfo = await db2.select({ phoneNumber: users.phoneNumber }).from(users).where(eq(users.id, userId)).limit(1);
      if (userInfo.length > 0) {
        await db2.delete(otpCodes).where(eq(otpCodes.phoneNumber, userInfo[0].phoneNumber));
      }
      await db2.delete(messages).where(eq(messages.userId, userId));
      const userChats = await db2.select().from(chats).where(
        sql2`JSON_ARRAY_LENGTH(${chats.participants}) = 1 AND JSON_EXTRACT(${chats.participants}, '$[0]') = ${userId}`
      );
      for (const chat of userChats) {
        await db2.delete(chats).where(eq(chats.id, chat.id));
      }
      const groupChats = await db2.select().from(chats).where(
        sql2`JSON_SEARCH(${chats.participants}, 'one', ${userId}) IS NOT NULL`
      );
      for (const chat of groupChats) {
        const participants = JSON.parse(chat.participants);
        const updatedParticipants = participants.filter((p) => p !== userId);
        if (updatedParticipants.length > 0) {
          await db2.update(chats).set({
            participants: JSON.stringify(updatedParticipants)
          }).where(eq(chats.id, chat.id));
        } else {
          await db2.delete(chats).where(eq(chats.id, chat.id));
        }
      }
      await db2.delete(users).where(eq(users.id, userId));
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }
  // Admin Credentials - Already implemented in MemStorage, copy those methods
  async getAdminCredentials() {
    try {
      if (!db2) {
        const dbModule = await Promise.resolve().then(() => (init_db(), db_exports));
        db2 = dbModule.db;
      }
      const [result] = await db2.select().from(adminCredentials).where(eq(adminCredentials.id, "admin_settings")).limit(1);
      return result || void 0;
    } catch (error) {
      console.error("Error getting admin credentials:", error);
      return void 0;
    }
  }
  async updateAdminCredentials(credentials) {
    try {
      if (!db2) {
        const dbModule = await Promise.resolve().then(() => (init_db(), db_exports));
        db2 = dbModule.db;
      }
      const adminCreds = {
        id: "admin_settings",
        email: credentials.email,
        password: credentials.password,
        updatedAt: /* @__PURE__ */ new Date(),
        createdAt: /* @__PURE__ */ new Date()
      };
      const [result] = await db2.insert(adminCredentials).values(adminCreds).onConflictDoUpdate({
        target: adminCredentials.id,
        set: {
          email: credentials.email,
          password: credentials.password,
          updatedAt: /* @__PURE__ */ new Date()
        }
      }).returning();
      return result;
    } catch (error) {
      console.error("Error updating admin credentials:", error);
      throw error;
    }
  }
  // Feature Management
  async getAllFeatures() {
    try {
      if (!db2) {
        const dbModule = await Promise.resolve().then(() => (init_db(), db_exports));
        db2 = dbModule.db;
      }
      const features = await db2.select().from(appFeatures).orderBy(appFeatures.priority);
      return features;
    } catch (error) {
      console.error("Error getting features:", error);
      return [];
    }
  }
  async getFeature(featureId) {
    try {
      if (!db2) {
        const dbModule = await Promise.resolve().then(() => (init_db(), db_exports));
        db2 = dbModule.db;
      }
      const [feature] = await db2.select().from(appFeatures).where(eq(appFeatures.id, featureId)).limit(1);
      return feature || void 0;
    } catch (error) {
      console.error("Error getting feature:", error);
      return void 0;
    }
  }
  async updateFeature(featureId, updates) {
    try {
      if (!db2) {
        const dbModule = await Promise.resolve().then(() => (init_db(), db_exports));
        db2 = dbModule.db;
      }
      const [feature] = await db2.update(appFeatures).set({
        ...updates,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(appFeatures.id, featureId)).returning();
      return feature || void 0;
    } catch (error) {
      console.error("Error updating feature:", error);
      return void 0;
    }
  }
  async initializeDefaultFeatures() {
    try {
      if (!db2) {
        const dbModule = await Promise.resolve().then(() => (init_db(), db_exports));
        db2 = dbModule.db;
      }
      const defaultFeatures = [
        {
          id: "messaging",
          name: "\u0627\u0644\u0645\u0631\u0627\u0633\u0644\u0629",
          description: "\u0625\u0631\u0633\u0627\u0644 \u0648\u0627\u0633\u062A\u0642\u0628\u0627\u0644 \u0627\u0644\u0631\u0633\u0627\u0626\u0644 \u0627\u0644\u0646\u0635\u064A\u0629 \u0648\u0627\u0644\u0648\u0633\u0627\u0626\u0637",
          isEnabled: true,
          category: "communication",
          priority: 1
        },
        {
          id: "stories",
          name: "\u0627\u0644\u062D\u0627\u0644\u0627\u062A",
          description: "\u0645\u0634\u0627\u0631\u0643\u0629 \u0627\u0644\u062D\u0627\u0644\u0627\u062A \u0648\u0627\u0644\u0635\u0648\u0631 \u0627\u0644\u0645\u0624\u0642\u062A\u0629",
          isEnabled: true,
          category: "social",
          priority: 2
        },
        {
          id: "stores",
          name: "\u0627\u0644\u0645\u062A\u0627\u062C\u0631",
          description: "\u0625\u0646\u0634\u0627\u0621 \u0648\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062A\u0627\u062C\u0631 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0629",
          isEnabled: true,
          category: "commerce",
          priority: 3
        },
        {
          id: "products",
          name: "\u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A",
          description: "\u0639\u0631\u0636 \u0648\u0628\u064A\u0639 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A",
          isEnabled: true,
          category: "commerce",
          priority: 4
        },
        {
          id: "cart",
          name: "\u0633\u0644\u0629 \u0627\u0644\u062A\u0633\u0648\u0642",
          description: "\u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0648\u0625\u062C\u0631\u0627\u0621 \u0639\u0645\u0644\u064A\u0627\u062A \u0627\u0644\u0634\u0631\u0627\u0621",
          isEnabled: true,
          category: "commerce",
          priority: 5
        },
        {
          id: "orders",
          name: "\u0627\u0644\u0637\u0644\u0628\u0627\u062A",
          description: "\u0645\u062A\u0627\u0628\u0639\u0629 \u0637\u0644\u0628\u0627\u062A\u0643 \u0648\u0645\u0628\u064A\u0639\u0627\u062A\u0643",
          isEnabled: true,
          category: "commerce",
          priority: 6
        },
        {
          id: "affiliate",
          name: "\u0627\u0644\u062A\u0633\u0648\u064A\u0642 \u0628\u0627\u0644\u0639\u0645\u0648\u0644\u0629",
          description: "\u0631\u0628\u062D \u0639\u0645\u0648\u0644\u0629 \u0645\u0646 \u062E\u0644\u0627\u0644 \u0645\u0634\u0627\u0631\u0643\u0629 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A",
          isEnabled: true,
          category: "monetization",
          priority: 7
        },
        {
          id: "contacts",
          name: "\u062C\u0647\u0627\u062A \u0627\u0644\u0627\u062A\u0635\u0627\u0644",
          description: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0623\u0635\u062F\u0642\u0627\u0621 \u0648\u062C\u0647\u0627\u062A \u0627\u0644\u0627\u062A\u0635\u0627\u0644",
          isEnabled: true,
          category: "communication",
          priority: 8
        },
        {
          id: "profile",
          name: "\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A",
          description: "\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0648\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0634\u062E\u0635\u064A\u0629",
          isEnabled: true,
          category: "account",
          priority: 9
        }
      ];
      const existingFeatures = await db2.select().from(appFeatures);
      if (existingFeatures.length === 0) {
        await db2.insert(appFeatures).values(defaultFeatures);
        console.log("Default features initialized in database");
      }
    } catch (error) {
      console.error("Error initializing features:", error);
    }
  }
  // For now, implement other methods as simple stubs to satisfy the interface
  // These can be fully implemented later when needed
  async createOtpCode(insertOtp) {
    const id = randomUUID();
    const otp = {
      ...insertOtp,
      id,
      isUsed: false,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.otpCodes = this.otpCodes || /* @__PURE__ */ new Map();
    this.otpCodes.set(id, otp);
    return otp;
  }
  async verifyOtpCode(phoneNumber, code) {
    if (!this.otpCodes) return false;
    const otp = Array.from(this.otpCodes.values()).find(
      (otp2) => otp2.phoneNumber === phoneNumber && otp2.code === code && !otp2.isUsed && otp2.expiresAt > /* @__PURE__ */ new Date()
    );
    if (otp) {
      otp.isUsed = true;
      this.otpCodes.set(otp.id, otp);
      return true;
    }
    return false;
  }
  async createSession(session) {
    try {
      const [newSession] = await db2.insert(sessions).values(session).returning();
      return newSession;
    } catch (error) {
      console.error("Error creating session:", error);
      throw error;
    }
  }
  async getSessionByToken(token) {
    try {
      const [session] = await db2.select().from(sessions).where(eq(sessions.token, token));
      if (session && session.expiresAt > /* @__PURE__ */ new Date()) {
        return session;
      }
      if (session) {
        await this.deleteSession(token);
      }
      return void 0;
    } catch (error) {
      console.error("Error getting session:", error);
      return void 0;
    }
  }
  async deleteSession(token) {
    try {
      await db2.delete(sessions).where(eq(sessions.token, token));
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  }
  async getChat(id) {
    return void 0;
  }
  async getUserChats(userId) {
    return [];
  }
  async createChat(chat) {
    throw new Error("Not implemented");
  }
  async deleteChat(id) {
    return false;
  }
  async getChatMessages(chatId) {
    return [];
  }
  async createMessage(message) {
    throw new Error("Not implemented");
  }
  async markMessageAsRead(messageId) {
  }
  async markMessageAsDelivered(messageId) {
  }
  async searchMessages(chatId, searchTerm) {
    return [];
  }
  async updateMessage(messageId, content) {
    return void 0;
  }
  async deleteMessage(messageId) {
  }
  async getActiveStories() {
    return [];
  }
  async getUserStories(userId) {
    return [];
  }
  async createStory(story) {
    throw new Error("Not implemented");
  }
  async viewStory(storyId, viewerId) {
  }
  async getStory(storyId) {
    return void 0;
  }
  async getStores(location, category) {
    return [];
  }
  async getStore(id) {
    return void 0;
  }
  async getUserStore(userId) {
    return void 0;
  }
  async createStore(store) {
    throw new Error("Not implemented");
  }
  async updateStore(id, store) {
    return void 0;
  }
  async deleteStore(id) {
    return false;
  }
  async getProducts(location, category) {
    return [];
  }
  async getProduct(id) {
    return void 0;
  }
  async getUserProducts(userId) {
    return [];
  }
  async getStoreProducts(storeId) {
    return [];
  }
  async createProduct(product) {
    throw new Error("Not implemented");
  }
  async updateProduct(id, product) {
    return void 0;
  }
  async deleteProduct(id) {
    return false;
  }
  async createAffiliateLink(affiliateLink) {
    throw new Error("Not implemented");
  }
  async getAffiliateLink(uniqueCode) {
    return void 0;
  }
  async getUserAffiliateLinks(userId) {
    return [];
  }
  async trackClick(uniqueCode) {
  }
  async trackConversion(uniqueCode, buyerId, amount) {
    throw new Error("Not implemented");
  }
  async getUserCommissions(userId) {
    return [];
  }
  async getTotalCommissions(userId) {
    return "0";
  }
  async getCommissionsByStatus(userId, status) {
    return [];
  }
  async getUserContacts(userId) {
    return [];
  }
  async addContact(contact) {
    throw new Error("Not implemented");
  }
  async searchUserByPhoneNumber(phoneNumber) {
    return void 0;
  }
  async updateContactAppUser(contactId, contactUserId) {
  }
  async getCartItems(userId) {
    return [];
  }
  async addToCart(cartItem) {
    throw new Error("Not implemented");
  }
  async updateCartItemQuantity(userId, productId, quantity) {
  }
  async removeFromCart(userId, productId) {
  }
  async clearCart(userId) {
  }
  async createOrder(order, items) {
    throw new Error("Not implemented");
  }
  async getUserOrders(userId) {
    return [];
  }
  async getSellerOrders(sellerId) {
    return [];
  }
  async getOrder(orderId) {
    return void 0;
  }
  async updateOrderStatus(orderId, status, updatedBy) {
    return void 0;
  }
  async cancelOrder(orderId, reason) {
    return void 0;
  }
  async createVerificationRequest(request) {
    throw new Error("Not implemented");
  }
  async getUserVerificationRequests(userId) {
    return [];
  }
  async getVerificationRequest(id) {
    return void 0;
  }
  async updateVerificationRequestStatus(id, status, adminNote, reviewedBy) {
    return void 0;
  }
  async likeStory(storyId, userId, reactionType) {
    throw new Error("Not implemented");
  }
  async unlikeStory(storyId, userId) {
  }
  async getStoryLikes(storyId) {
    return [];
  }
  async getStoryLikeCount(storyId) {
    return 0;
  }
  async hasUserLikedStory(storyId, userId) {
    return false;
  }
  async addStoryComment(comment) {
    throw new Error("Not implemented");
  }
  async getStoryComments(storyId) {
    return [];
  }
  async updateStoryComment(commentId, content) {
    return void 0;
  }
  async deleteStoryComment(commentId) {
  }
  async getStoryCommentCount(storyId) {
    return 0;
  }
  async getAllStickers() {
    return [];
  }
  async getStickersByCategory(category) {
    return [];
  }
  async getSticker(id) {
    return void 0;
  }
  async createSticker(sticker) {
    throw new Error("Not implemented");
  }
  async getUserById(id) {
    return this.getUser(id);
  }
  async getAllUsers() {
    try {
      if (!db2) {
        const dbModule = await Promise.resolve().then(() => (init_db(), db_exports));
        db2 = dbModule.db;
      }
      return await db2.select().from(users);
    } catch (error) {
      console.error("Error getting all users:", error);
      return [];
    }
  }
  async getAllVerificationRequests(status) {
    return [];
  }
  async updateUserAdminStatus(userId, isAdmin) {
    try {
      if (!db2) {
        const dbModule = await Promise.resolve().then(() => (init_db(), db_exports));
        db2 = dbModule.db;
      }
      const [user] = await db2.update(users).set({
        isAdmin,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(users.id, userId)).returning();
      return user || void 0;
    } catch (error) {
      console.error("Error updating user admin status:", error);
      return void 0;
    }
  }
  async updateUserVerificationStatus(userId, isVerified) {
    try {
      if (!db2) {
        const dbModule = await Promise.resolve().then(() => (init_db(), db_exports));
        db2 = dbModule.db;
      }
      const [user] = await db2.update(users).set({
        isVerified,
        verifiedAt: isVerified ? /* @__PURE__ */ new Date() : null,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(users.id, userId)).returning();
      return user || void 0;
    } catch (error) {
      console.error("Error updating user verification status:", error);
      return void 0;
    }
  }
  async getAllStores() {
    return [];
  }
  async updateStoreStatus(storeId, status, adminId, rejectionReason) {
    return void 0;
  }
  async getAllOrders() {
    return [];
  }
  async getAdminDashboardStats() {
    return {
      totalUsers: 0,
      totalStores: 0,
      totalOrders: 0,
      pendingVerifications: 0,
      recentOrders: 0,
      totalRevenue: "0",
      activeUsers: 0,
      verifiedUsers: 0
    };
  }
};
var storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();

// server/routes.ts
init_schema();
import multer from "multer";
import path2 from "path";
import fs2 from "fs";
import { randomUUID as randomUUID2 } from "crypto";

// server/admin-manager.ts
import fs from "fs";
import path from "path";
var AdminManager = class {
  adminFilePath;
  storage;
  constructor(storage2) {
    this.adminFilePath = path.join(process.cwd(), "admin.json");
    this.storage = storage2;
  }
  /**
   * قراءة بيانات الإدارة من ملف admin.json
   */
  readAdminConfig() {
    try {
      const adminFileContent = fs.readFileSync(this.adminFilePath, "utf8");
      return JSON.parse(adminFileContent);
    } catch (error) {
      console.error("Error reading admin.json:", error);
      return null;
    }
  }
  /**
   * التحقق من صحة بيانات تسجيل الدخول
   */
  validateCredentials(email, password) {
    const adminConfig = this.readAdminConfig();
    if (!adminConfig) {
      return false;
    }
    return email === adminConfig.email && password === adminConfig.password;
  }
  /**
   * البحث عن مستخدم الإدارة أو إنشاؤه
   */
  async ensureAdminUser() {
    const adminConfig = this.readAdminConfig();
    if (!adminConfig) {
      throw new Error("\u062A\u0639\u0630\u0631 \u0642\u0631\u0627\u0621\u0629 \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0625\u062F\u0627\u0631\u0629");
    }
    try {
      const existingUsers = await this.storage.getAllUsers();
      let adminUser = existingUsers.find((user) => user.phoneNumber === "+213123456789");
      if (adminUser) {
        console.log("\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0645\u0633\u062A\u062E\u062F\u0645 \u0625\u062F\u0627\u0631\u0629 \u0645\u0648\u062C\u0648\u062F:", adminUser.name);
        if (!adminUser.isAdmin) {
          adminUser = await this.storage.updateUserAdminStatus(adminUser.id, true);
        }
        return adminUser;
      }
      const firstAdminUser = existingUsers.find((user) => user.isAdmin);
      if (firstAdminUser) {
        console.log("\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0645\u0633\u062A\u062E\u062F\u0645 \u0625\u062F\u0627\u0631\u0629 \u0628\u062F\u064A\u0644:", firstAdminUser.name);
        return firstAdminUser;
      }
      console.log("\u0625\u0646\u0634\u0627\u0621 \u0645\u0633\u062A\u062E\u062F\u0645 \u0625\u062F\u0627\u0631\u0629 \u062C\u062F\u064A\u062F...");
      adminUser = await this.storage.createUser({
        name: adminConfig.name || "\u0627\u0644\u0645\u062F\u064A\u0631 \u0627\u0644\u0639\u0627\u0645",
        phoneNumber: "+213123456789",
        location: "\u0627\u0644\u062C\u0632\u0627\u0626\u0631",
        avatar: null,
        isOnline: true
      });
      if (!adminUser) {
        throw new Error("\u0641\u0634\u0644 \u0641\u064A \u0625\u0646\u0634\u0627\u0621 \u0645\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0625\u062F\u0627\u0631\u0629");
      }
      if (adminUser) {
        adminUser = await this.storage.updateUserAdminStatus(adminUser.id, true);
        await this.storage.updateUserVerificationStatus(adminUser.id, true);
      }
      console.log("\u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u0645\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0628\u0646\u062C\u0627\u062D:", adminUser?.name);
      return adminUser;
    } catch (error) {
      console.error("\u062E\u0637\u0623 \u0641\u064A \u0625\u062F\u0627\u0631\u0629 \u0645\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0625\u062F\u0627\u0631\u0629:", error);
      throw new Error("\u0641\u0634\u0644 \u0641\u064A \u0625\u0646\u0634\u0627\u0621 \u0623\u0648 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0645\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0625\u062F\u0627\u0631\u0629");
    }
  }
  /**
   * تحديث وقت آخر تسجيل دخول
   */
  updateLastLogin() {
    try {
      const adminConfig = this.readAdminConfig();
      if (adminConfig) {
        adminConfig.lastLogin = (/* @__PURE__ */ new Date()).toISOString();
        fs.writeFileSync(this.adminFilePath, JSON.stringify(adminConfig, null, 2));
      }
    } catch (error) {
      console.error("\u062E\u0637\u0623 \u0641\u064A \u062A\u062D\u062F\u064A\u062B \u0648\u0642\u062A \u0622\u062E\u0631 \u062A\u0633\u062C\u064A\u0644 \u062F\u062E\u0648\u0644:", error);
    }
  }
  /**
   * إنشاء بيانات تجريبية عند أول تسجيل دخول
   */
  async createSampleDataIfNeeded() {
    try {
      const allUsers = await this.storage.getAllUsers();
      if (allUsers.length <= 1) {
        console.log("\u0625\u0646\u0634\u0627\u0621 \u0628\u064A\u0627\u0646\u0627\u062A \u062A\u062C\u0631\u064A\u0628\u064A\u0629...");
        const user1 = await this.storage.createUser({
          name: "\u0623\u062D\u0645\u062F \u0645\u062D\u0645\u062F",
          phoneNumber: "+213555123456",
          location: "\u062A\u0646\u062F\u0648\u0641",
          avatar: null,
          isOnline: true
        });
        await this.storage.updateUserVerificationStatus(user1.id, true);
        await this.storage.createUser({
          name: "\u0641\u0627\u0637\u0645\u0629 \u0628\u0646 \u0639\u0644\u064A",
          phoneNumber: "+213555234567",
          location: "\u0627\u0644\u062C\u0632\u0627\u0626\u0631",
          avatar: null,
          isOnline: false
        });
        const user3 = await this.storage.createUser({
          name: "\u064A\u0648\u0633\u0641 \u0627\u0644\u0632\u0647\u0631\u0627\u0646\u064A",
          phoneNumber: "+213555345678",
          location: "\u0648\u0647\u0631\u0627\u0646",
          avatar: null,
          isOnline: true
        });
        await this.storage.updateUserVerificationStatus(user3.id, true);
        console.log("\u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062A\u062C\u0631\u064A\u0628\u064A\u0629 \u0628\u0646\u062C\u0627\u062D");
      }
    } catch (error) {
      console.error("\u062E\u0637\u0623 \u0641\u064A \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062A\u062C\u0631\u064A\u0628\u064A\u0629:", error);
    }
  }
  /**
   * التحقق من صحة حالة الإدارة
   */
  async validateAdminState() {
    try {
      const adminConfig = this.readAdminConfig();
      if (!adminConfig || !adminConfig.isActive) {
        return false;
      }
      const allUsers = await this.storage.getAllUsers();
      const hasAdminUser = allUsers.some((user) => user.isAdmin);
      return hasAdminUser;
    } catch (error) {
      console.error("\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u062D\u0627\u0644\u0629 \u0627\u0644\u0625\u062F\u0627\u0631\u0629:", error);
      return false;
    }
  }
};

// server/routes.ts
var upload = multer({
  storage: multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
      const fileExtension = path2.extname(file.originalname);
      const fileName = `${randomUUID2()}${fileExtension}`;
      cb(null, fileName);
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024
    // 50MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/") || file.mimetype.startsWith("audio/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image, video, and audio files are allowed"));
    }
  }
});
var audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB limit for audio files
  },
  fileFilter: (req, file, cb) => {
    console.log("Audio file upload - MIME type:", file.mimetype);
    if (file.mimetype.startsWith("audio/") || file.mimetype === "audio/wav" || file.mimetype === "audio/webm" || file.mimetype === "audio/mp4" || file.mimetype === "audio/mpeg" || file.originalname.endsWith(".webm") || file.originalname.endsWith(".wav") || file.originalname.endsWith(".mp3") || file.originalname.endsWith(".mp4")) {
      cb(null, true);
    } else {
      console.log("Rejected file type:", file.mimetype, file.originalname);
      cb(new Error("Only audio files are allowed"));
    }
  }
});
var requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token required" });
  }
  const session = await storage.getSessionByToken(token);
  if (!session) {
    return res.status(401).json({ message: "Invalid token" });
  }
  req.userId = session.userId;
  next();
};
var requireAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token required" });
  }
  const session = await storage.getSessionByToken(token);
  if (!session) {
    return res.status(401).json({ message: "Invalid token" });
  }
  const user = await storage.getUserById(session.userId);
  if (!user || !user.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  req.userId = session.userId;
  req.isAdmin = true;
  next();
};
async function registerRoutes(app2) {
  app2.use("/uploads", express.static("uploads"));
  app2.post("/api/upload/media", requireAuth, upload.single("media"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No media file provided" });
      }
      const fileType = req.file.mimetype.startsWith("video/") ? "video" : "image";
      const mediaUrl = `/uploads/${req.file.filename}`;
      res.json({
        mediaUrl,
        fileType,
        fileName: req.file.originalname,
        size: req.file.size
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Failed to upload media file" });
    }
  });
  app2.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required" });
      }
      const code = Math.floor(1e5 + Math.random() * 9e5).toString();
      const otpData = insertOtpSchema.parse({
        phoneNumber,
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1e3),
        // 5 minutes
        isUsed: false
      });
      await storage.createOtpCode(otpData);
      console.log(`OTP for ${phoneNumber}: ${code}`);
      global.lastOtp = { phoneNumber, code, timestamp: Date.now() };
      const shouldShowOTP = !process.env.SMS_SERVICE_ENABLED;
      res.json({
        success: true,
        message: shouldShowOTP ? "\u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642: " + code : "\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642 \u0639\u0628\u0631 \u0627\u0644\u0631\u0633\u0627\u0626\u0644 \u0627\u0644\u0646\u0635\u064A\u0629",
        code: shouldShowOTP ? code : void 0,
        showDirectly: shouldShowOTP
      });
    } catch (error) {
      console.error("OTP sending error:", error);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });
  app2.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { phoneNumber, code, name, location } = req.body;
      if (!phoneNumber || !code) {
        return res.status(400).json({ message: "Phone number and code are required" });
      }
      const isValidOtp = await storage.verifyOtpCode(phoneNumber, code);
      if (!isValidOtp) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }
      let user = await storage.getUserByPhoneNumber(phoneNumber);
      if (!user) {
        if (!name || !location) {
          return res.status(400).json({ message: "Name and location are required for new users" });
        }
        const userData = insertUserSchema.parse({
          phoneNumber,
          name,
          location,
          avatar: null,
          isOnline: true,
          isAdmin: process.env.NODE_ENV === "development"
          // Make users admin in development
        });
        user = await storage.createUser(userData);
      } else {
        await storage.updateUserOnlineStatus(user.id, true);
      }
      const token = randomUUID2();
      const sessionData = insertSessionSchema.parse({
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3)
        // 7 days
      });
      await storage.createSession(sessionData);
      res.json({
        success: true,
        user,
        token,
        message: "Authentication successful"
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });
  app2.post("/api/auth/create-user", async (req, res) => {
    try {
      const { phoneNumber, name, location } = req.body;
      if (!phoneNumber || !name || !location) {
        return res.status(400).json({ message: "Phone number, name and location are required" });
      }
      let user = await storage.getUserByPhoneNumber(phoneNumber);
      if (user) {
        return res.status(400).json({ message: "User already exists" });
      }
      const userData = insertUserSchema.parse({
        phoneNumber,
        name,
        location,
        avatar: null,
        isOnline: true,
        isAdmin: process.env.NODE_ENV === "development"
        // Make users admin in development
      });
      user = await storage.createUser(userData);
      const token = randomUUID2();
      const sessionData = insertSessionSchema.parse({
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3)
        // 7 days
      });
      await storage.createSession(sessionData);
      res.json({
        success: true,
        user,
        token,
        message: "User created successfully"
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  app2.get("/api/dev/last-otp", (req, res) => {
    if (process.env.NODE_ENV !== "development") {
      return res.status(404).json({ message: "Not found" });
    }
    const lastOtp = global.lastOtp;
    if (lastOtp && Date.now() - lastOtp.timestamp < 3e5) {
      res.json({ code: lastOtp.code, phoneNumber: lastOtp.phoneNumber });
    } else {
      res.json({ code: null });
    }
  });
  app2.post("/api/dev/make-admin", requireAuth, async (req, res) => {
    if (process.env.NODE_ENV !== "development") {
      return res.status(404).json({ message: "Not found" });
    }
    try {
      const updatedUser = await storage.updateUserAdminStatus(req.userId, true);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ success: true, user: updatedUser, message: "User promoted to admin" });
    } catch (error) {
      res.status(500).json({ message: "Failed to promote user to admin" });
    }
  });
  app2.post("/api/dev/make-admin-by-phone", async (req, res) => {
    if (process.env.NODE_ENV !== "development") {
      return res.status(404).json({ message: "Not found" });
    }
    try {
      const { phoneNumber } = req.body;
      if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number required" });
      }
      const user = await storage.getUserByPhoneNumber(phoneNumber);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const updatedUser = await storage.updateUserAdminStatus(user.id, true);
      res.json({ success: true, user: updatedUser, message: "User promoted to admin" });
    } catch (error) {
      res.status(500).json({ message: "Failed to promote user to admin" });
    }
  });
  app2.post("/api/auth/logout", requireAuth, async (req, res) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (token) {
        await storage.deleteSession(token);
        await storage.updateUserOnlineStatus(req.userId, false);
      }
      res.json({ success: true, message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to logout" });
    }
  });
  app2.get("/api/user/current", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });
  app2.put("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const { name, location, avatar, avatarUrl } = req.body;
      if (!name || !location) {
        return res.status(400).json({ message: "Name and location are required" });
      }
      const updatedUser = await storage.updateUser(req.userId, {
        name: name.trim(),
        location: location.trim(),
        avatar: avatar || avatarUrl || null
      });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  app2.delete("/api/user/delete-account", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteUser(req.userId);
      if (!success) {
        return res.status(500).json({ message: "\u0641\u0634\u0644 \u0641\u064A \u062D\u0630\u0641 \u0627\u0644\u062D\u0633\u0627\u0628" });
      }
      res.json({ message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u062D\u0633\u0627\u0628 \u0628\u0646\u062C\u0627\u062D" });
    } catch (error) {
      console.error("Delete account error:", error);
      res.status(500).json({ message: "\u0641\u0634\u0644 \u0641\u064A \u062D\u0630\u0641 \u0627\u0644\u062D\u0633\u0627\u0628" });
    }
  });
  app2.get("/api/chats", requireAuth, async (req, res) => {
    try {
      const chats2 = await storage.getUserChats(req.userId);
      const chatsWithDetails = await Promise.all(
        chats2.map(async (chat) => {
          const messages2 = await storage.getChatMessages(chat.id);
          const lastMessage = messages2[messages2.length - 1] || null;
          const unreadCount = messages2.filter(
            (msg) => msg.senderId !== req.userId && !msg.isRead
          ).length;
          let otherParticipant = null;
          if (!chat.isGroup && chat.participants.length === 2) {
            const otherParticipantId = chat.participants.find((id) => id !== req.userId);
            if (otherParticipantId) {
              otherParticipant = await storage.getUser(otherParticipantId);
            }
          }
          return {
            ...chat,
            lastMessage,
            unreadCount,
            otherParticipant
          };
        })
      );
      res.json(chatsWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to get chats" });
    }
  });
  app2.post("/api/chats/start", requireAuth, async (req, res) => {
    try {
      console.log("Chat start request body:", req.body);
      console.log("Received data:", JSON.stringify(req.body, null, 2));
      const { otherUserId } = req.body;
      console.log("Extracted otherUserId:", otherUserId);
      if (!otherUserId) {
        console.log("Missing otherUserId in request");
        return res.status(400).json({ message: "Other user ID is required" });
      }
      if (otherUserId === req.userId) {
        return res.status(400).json({ message: "Cannot start chat with yourself" });
      }
      const otherUser = await storage.getUser(otherUserId);
      if (!otherUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const allChats = await storage.getUserChats(req.userId);
      const existingChat = allChats.find(
        (chat) => !chat.isGroup && chat.participants.length === 2 && chat.participants.includes(otherUserId)
      );
      if (existingChat) {
        return res.json({ chatId: existingChat.id, isNew: false });
      }
      const chatData = insertChatSchema.parse({
        name: null,
        isGroup: false,
        avatar: null,
        participants: [req.userId, otherUserId]
      });
      const newChat = await storage.createChat(chatData);
      res.json({ chatId: newChat.id, isNew: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to start chat" });
    }
  });
  app2.get("/api/chats/:chatId/messages", requireAuth, async (req, res) => {
    try {
      const { chatId } = req.params;
      const messages2 = await storage.getChatMessages(chatId);
      const messagesWithSenders = await Promise.all(
        messages2.map(async (message) => {
          const sender = await storage.getUser(message.senderId);
          return {
            ...message,
            sender
          };
        })
      );
      res.json(messagesWithSenders);
    } catch (error) {
      res.status(500).json({ message: "Failed to get messages" });
    }
  });
  app2.post("/api/chats/:chatId/messages", requireAuth, async (req, res) => {
    try {
      const { chatId } = req.params;
      const messageData = insertMessageSchema.parse({
        ...req.body,
        chatId,
        senderId: req.userId
      });
      const message = await storage.createMessage(messageData);
      const sender = await storage.getUser(message.senderId);
      res.json({
        ...message,
        sender
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to send message" });
    }
  });
  app2.post("/api/chats/:chatId/messages/audio", requireAuth, audioUpload.single("audio"), async (req, res) => {
    try {
      const { chatId } = req.params;
      const { messageType, replyToId } = req.body;
      if (!req.file) {
        return res.status(400).json({ message: "No audio file provided" });
      }
      const audioFilename = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.wav`;
      const audioUrl = `/uploads/${audioFilename}`;
      const uploadDir = path2.join(process.cwd(), "uploads");
      if (!fs2.existsSync(uploadDir)) {
        fs2.mkdirSync(uploadDir, { recursive: true });
      }
      fs2.writeFileSync(path2.join(uploadDir, audioFilename), req.file.buffer);
      const messageData = insertMessageSchema.parse({
        chatId,
        senderId: req.userId,
        content: null,
        messageType: "audio",
        audioUrl,
        replyToMessageId: replyToId || null
      });
      const message = await storage.createMessage(messageData);
      const sender = await storage.getUser(message.senderId);
      res.json({
        ...message,
        sender
      });
    } catch (error) {
      console.error("Error sending audio message:", error);
      res.status(500).json({ message: "Failed to send audio message" });
    }
  });
  app2.delete("/api/chats/:chatId", requireAuth, async (req, res) => {
    try {
      const { chatId } = req.params;
      const chat = await storage.getChat(chatId);
      if (!chat || !chat.participants.includes(req.userId)) {
        return res.status(403).json({ message: "Unauthorized to delete this chat" });
      }
      const deleted = await storage.deleteChat(chatId);
      if (!deleted) {
        return res.status(404).json({ message: "Chat not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete chat" });
    }
  });
  app2.patch("/api/messages/:messageId/read", requireAuth, async (req, res) => {
    try {
      const { messageId } = req.params;
      await storage.markMessageAsRead(messageId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });
  app2.get("/api/chats/:chatId/messages/search", requireAuth, async (req, res) => {
    try {
      const { chatId } = req.params;
      const { q: searchTerm } = req.query;
      if (!searchTerm) {
        return res.status(400).json({ message: "Search term is required" });
      }
      const messages2 = await storage.searchMessages(chatId, searchTerm);
      const messagesWithSenders = await Promise.all(
        messages2.map(async (message) => {
          const sender = await storage.getUser(message.senderId);
          return {
            ...message,
            sender
          };
        })
      );
      res.json(messagesWithSenders);
    } catch (error) {
      res.status(500).json({ message: "Failed to search messages" });
    }
  });
  app2.patch("/api/messages/:messageId", requireAuth, async (req, res) => {
    try {
      const { messageId } = req.params;
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }
      const message = await storage.updateMessage(messageId, content);
      if (!message) {
        return res.status(404).json({ message: "Message not found or cannot be edited" });
      }
      const sender = await storage.getUser(message.senderId);
      res.json({
        ...message,
        sender
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update message" });
    }
  });
  app2.delete("/api/messages/:messageId", requireAuth, async (req, res) => {
    try {
      const { messageId } = req.params;
      await storage.deleteMessage(messageId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete message" });
    }
  });
  app2.get("/api/stories", requireAuth, async (req, res) => {
    try {
      const stories2 = await storage.getActiveStories();
      res.json(stories2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get stories" });
    }
  });
  app2.get("/api/users/:userId/stories", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const stories2 = await storage.getUserStories(userId);
      res.json(stories2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user stories" });
    }
  });
  app2.post("/api/stories", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      console.log("Creating story with data:", req.body);
      console.log("User location:", currentUser.location);
      const storyData = insertStorySchema.parse({
        ...req.body,
        userId: req.userId,
        location: currentUser.location,
        // Use user's location
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1e3)
        // 24 hours from now
      });
      console.log("Parsed story data:", storyData);
      const story = await storage.createStory(storyData);
      console.log("Story created successfully:", story.id);
      res.json(story);
    } catch (error) {
      console.error("Error creating story:", error);
      res.status(500).json({
        message: "Failed to create story",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.patch("/api/stories/:storyId/view", requireAuth, async (req, res) => {
    try {
      const { storyId } = req.params;
      await storage.viewStory(storyId, req.userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to view story" });
    }
  });
  app2.get("/api/stories/:storyId", requireAuth, async (req, res) => {
    try {
      const { storyId } = req.params;
      const story = await storage.getStory(storyId);
      if (!story) {
        return res.status(404).json({ message: "Story not found" });
      }
      const user = await storage.getUser(story.userId);
      res.json({ ...story, user });
    } catch (error) {
      res.status(500).json({ message: "Failed to get story" });
    }
  });
  app2.post("/api/stories/:storyId/like", requireAuth, async (req, res) => {
    try {
      const { storyId } = req.params;
      const { reactionType } = req.body;
      const story = await storage.getStory(storyId);
      if (!story) {
        return res.status(404).json({ message: "Story not found" });
      }
      const like = await storage.likeStory(storyId, req.userId, reactionType);
      res.json(like);
    } catch (error) {
      res.status(500).json({ message: "Failed to like story" });
    }
  });
  app2.delete("/api/stories/:storyId/like", requireAuth, async (req, res) => {
    try {
      const { storyId } = req.params;
      const story = await storage.getStory(storyId);
      if (!story) {
        return res.status(404).json({ message: "Story not found" });
      }
      await storage.unlikeStory(storyId, req.userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to unlike story" });
    }
  });
  app2.get("/api/stories/:storyId/likes", requireAuth, async (req, res) => {
    try {
      const { storyId } = req.params;
      const story = await storage.getStory(storyId);
      if (!story) {
        return res.status(404).json({ message: "Story not found" });
      }
      const likes = await storage.getStoryLikes(storyId);
      const likeCount = await storage.getStoryLikeCount(storyId);
      const hasUserLiked = await storage.hasUserLikedStory(storyId, req.userId);
      res.json({
        likes,
        count: likeCount,
        hasUserLiked
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get story likes" });
    }
  });
  app2.post("/api/stories/:storyId/comments", requireAuth, async (req, res) => {
    try {
      const { storyId } = req.params;
      const { content } = req.body;
      const story = await storage.getStory(storyId);
      if (!story) {
        return res.status(404).json({ message: "Story not found" });
      }
      if (!content?.trim()) {
        return res.status(400).json({ message: "Comment content is required" });
      }
      const commentData = insertStoryCommentSchema.parse({
        storyId,
        userId: req.userId,
        content: content.trim()
      });
      const comment = await storage.addStoryComment(commentData);
      const user = await storage.getUser(req.userId);
      res.json({ ...comment, user });
    } catch (error) {
      res.status(500).json({ message: "Failed to add comment" });
    }
  });
  app2.get("/api/stories/:storyId/comments", requireAuth, async (req, res) => {
    try {
      const { storyId } = req.params;
      const story = await storage.getStory(storyId);
      if (!story) {
        return res.status(404).json({ message: "Story not found" });
      }
      const comments = await storage.getStoryComments(storyId);
      const commentCount = await storage.getStoryCommentCount(storyId);
      res.json({
        comments,
        count: commentCount
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get story comments" });
    }
  });
  app2.put("/api/stories/:storyId/comments/:commentId", requireAuth, async (req, res) => {
    try {
      const { commentId } = req.params;
      const { content } = req.body;
      if (!content?.trim()) {
        return res.status(400).json({ message: "Comment content is required" });
      }
      const updatedComment = await storage.updateStoryComment(commentId, content.trim());
      if (!updatedComment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      if (updatedComment.userId !== req.userId) {
        return res.status(403).json({ message: "Not authorized to edit this comment" });
      }
      const user = await storage.getUser(updatedComment.userId);
      res.json({ ...updatedComment, user });
    } catch (error) {
      res.status(500).json({ message: "Failed to update comment" });
    }
  });
  app2.delete("/api/stories/:storyId/comments/:commentId", requireAuth, async (req, res) => {
    try {
      const { commentId } = req.params;
      const comments = await storage.getStoryComments(req.params.storyId);
      const comment = comments.find((c) => c.id === commentId);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      if (comment.userId !== req.userId) {
        return res.status(403).json({ message: "Not authorized to delete this comment" });
      }
      await storage.deleteStoryComment(commentId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });
  app2.get("/api/stores", requireAuth, async (req, res) => {
    try {
      const { location, category } = req.query;
      const stores2 = await storage.getStores(location, category);
      res.json(stores2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get stores" });
    }
  });
  app2.get("/api/stores/:storeId", requireAuth, async (req, res) => {
    try {
      const { storeId } = req.params;
      const store = await storage.getStore(storeId);
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }
      const owner = await storage.getUser(store.userId);
      res.json({ ...store, owner });
    } catch (error) {
      res.status(500).json({ message: "Failed to get store" });
    }
  });
  app2.get("/api/user/store", requireAuth, async (req, res) => {
    try {
      const store = await storage.getUserStore(req.userId);
      res.json(store || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user store" });
    }
  });
  app2.get("/api/stores/:storeId/products", requireAuth, async (req, res) => {
    try {
      const { storeId } = req.params;
      const products2 = await storage.getStoreProducts(storeId);
      res.json(products2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get store products" });
    }
  });
  app2.post("/api/stores", requireAuth, async (req, res) => {
    try {
      console.log("Store creation request:", req.body);
      console.log("User ID:", req.userId);
      const existingStore = await storage.getUserStore(req.userId);
      if (existingStore) {
        console.log("User already has store:", existingStore.id);
        return res.status(400).json({ message: "User already has a store" });
      }
      const storeData = insertStoreSchema.parse({
        ...req.body,
        userId: req.userId
      });
      console.log("Parsed store data:", storeData);
      const store = await storage.createStore(storeData);
      console.log("Store created successfully:", store.id);
      res.json(store);
    } catch (error) {
      console.error("Store creation error:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create store" });
      }
    }
  });
  app2.patch("/api/stores/:storeId", requireAuth, async (req, res) => {
    try {
      const { storeId } = req.params;
      const store = await storage.getStore(storeId);
      if (!store || store.userId !== req.userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      const updatedStore = await storage.updateStore(storeId, req.body);
      if (!updatedStore) {
        return res.status(404).json({ message: "Store not found" });
      }
      res.json(updatedStore);
    } catch (error) {
      res.status(500).json({ message: "Failed to update store" });
    }
  });
  app2.delete("/api/stores/:storeId", requireAuth, async (req, res) => {
    try {
      const { storeId } = req.params;
      const store = await storage.getStore(storeId);
      if (!store || store.userId !== req.userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      const deleted = await storage.deleteStore(storeId);
      if (!deleted) {
        return res.status(404).json({ message: "Store not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete store" });
    }
  });
  app2.get("/api/products", requireAuth, async (req, res) => {
    try {
      const { location, category } = req.query;
      const products2 = await storage.getProducts(location, category);
      res.json(products2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get products" });
    }
  });
  app2.get("/api/products/:productId", requireAuth, async (req, res) => {
    try {
      const { productId } = req.params;
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to get product" });
    }
  });
  app2.get("/api/user/products", requireAuth, async (req, res) => {
    try {
      const products2 = await storage.getUserProducts(req.userId);
      res.json(products2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user products" });
    }
  });
  app2.get("/api/products/store/:storeId", async (req, res) => {
    try {
      const { storeId } = req.params;
      const products2 = await storage.getStoreProducts(storeId);
      res.json(products2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get store products" });
    }
  });
  app2.post("/api/products", requireAuth, async (req, res) => {
    try {
      const productData = insertProductSchema.parse({
        ...req.body,
        userId: req.userId
      });
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to create product" });
    }
  });
  app2.patch("/api/products/:productId", requireAuth, async (req, res) => {
    try {
      const { productId } = req.params;
      const product = await storage.getProduct(productId);
      if (!product || product.userId !== req.userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      const updatedProduct = await storage.updateProduct(productId, req.body);
      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(updatedProduct);
    } catch (error) {
      res.status(500).json({ message: "Failed to update product" });
    }
  });
  app2.delete("/api/products/:productId", requireAuth, async (req, res) => {
    try {
      const { productId } = req.params;
      const product = await storage.getProduct(productId);
      if (!product || product.userId !== req.userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      const deleted = await storage.deleteProduct(productId);
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });
  app2.post("/api/affiliate-links", requireAuth, async (req, res) => {
    try {
      const affiliateLinkData = insertAffiliateLinkSchema.parse({
        ...req.body,
        affiliateId: req.userId
      });
      const product = await storage.getProduct(affiliateLinkData.productId);
      if (!product || !product.isActive) {
        return res.status(404).json({ message: "Product not found or inactive" });
      }
      const affiliateLink = await storage.createAffiliateLink(affiliateLinkData);
      res.json(affiliateLink);
    } catch (error) {
      res.status(500).json({ message: "Failed to create affiliate link" });
    }
  });
  app2.get("/api/user/affiliate-links", requireAuth, async (req, res) => {
    try {
      const links = await storage.getUserAffiliateLinks(req.userId);
      res.json(links);
    } catch (error) {
      res.status(500).json({ message: "Failed to get affiliate links" });
    }
  });
  app2.post("/api/affiliate/:uniqueCode/click", async (req, res) => {
    try {
      const { uniqueCode } = req.params;
      const link = await storage.getAffiliateLink(uniqueCode);
      if (!link) {
        return res.status(404).json({ message: "Affiliate link not found" });
      }
      await storage.trackClick(uniqueCode);
      const product = await storage.getProduct(link.productId);
      res.json({
        success: true,
        product,
        redirectUrl: `/product/${link.productId}`
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to track click" });
    }
  });
  app2.post("/api/affiliate/:uniqueCode/conversion", requireAuth, async (req, res) => {
    try {
      const { uniqueCode } = req.params;
      const { amount } = req.body;
      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Valid amount is required" });
      }
      const commission = await storage.trackConversion(uniqueCode, req.userId, amount);
      res.json(commission);
    } catch (error) {
      res.status(500).json({ message: "Failed to track conversion" });
    }
  });
  app2.get("/api/user/commissions", requireAuth, async (req, res) => {
    try {
      const commissions2 = await storage.getUserCommissions(req.userId);
      res.json(commissions2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get commissions" });
    }
  });
  app2.get("/api/user/commissions/total", requireAuth, async (req, res) => {
    try {
      const total = await storage.getTotalCommissions(req.userId);
      res.json({ total });
    } catch (error) {
      res.status(500).json({ message: "Failed to get total commissions" });
    }
  });
  app2.get("/api/user/commissions/:status", requireAuth, async (req, res) => {
    try {
      const { status } = req.params;
      const commissions2 = await storage.getCommissionsByStatus(req.userId, status);
      res.json(commissions2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get commissions by status" });
    }
  });
  app2.get("/api/contacts", requireAuth, async (req, res) => {
    try {
      const contacts2 = await storage.getUserContacts(req.userId);
      res.json(contacts2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get contacts" });
    }
  });
  app2.post("/api/contacts", requireAuth, async (req, res) => {
    try {
      const contactData = insertContactSchema.parse({
        ...req.body,
        userId: req.userId
      });
      const contact = await storage.addContact(contactData);
      res.json(contact);
    } catch (error) {
      res.status(500).json({ message: "Failed to add contact" });
    }
  });
  app2.post("/api/contacts/search", requireAuth, async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required" });
      }
      const user = await storage.searchUserByPhoneNumber(phoneNumber);
      res.json({ user: user || null, hasApp: !!user });
    } catch (error) {
      res.status(500).json({ message: "Failed to search user" });
    }
  });
  app2.get("/api/cart", requireAuth, async (req, res) => {
    try {
      const cartItems2 = await storage.getCartItems(req.userId);
      res.json(cartItems2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get cart items" });
    }
  });
  app2.post("/api/cart", requireAuth, async (req, res) => {
    try {
      const cartItemData = insertCartItemSchema.parse({
        ...req.body,
        userId: req.userId
      });
      const cartItem = await storage.addToCart(cartItemData);
      res.json(cartItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to add item to cart" });
    }
  });
  app2.put("/api/cart/:productId", requireAuth, async (req, res) => {
    try {
      const { productId } = req.params;
      const { quantity } = req.body;
      if (!quantity || parseInt(quantity) <= 0) {
        return res.status(400).json({ message: "Valid quantity is required" });
      }
      await storage.updateCartItemQuantity(req.userId, productId, quantity);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });
  app2.delete("/api/cart/:productId", requireAuth, async (req, res) => {
    try {
      const { productId } = req.params;
      await storage.removeFromCart(req.userId, productId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove item from cart" });
    }
  });
  app2.delete("/api/cart", requireAuth, async (req, res) => {
    try {
      await storage.clearCart(req.userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });
  app2.post("/api/orders", requireAuth, async (req, res) => {
    try {
      const { order, items } = req.body;
      console.log("Order creation request:", {
        userId: req.userId,
        order,
        items
      });
      if (!order) {
        return res.status(400).json({ message: "Order data is required" });
      }
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Order items are required" });
      }
      const orderData = insertOrderSchema.parse({
        ...order,
        buyerId: req.userId
      });
      const orderItems2 = items.map((item) => insertOrderItemSchema.parse(item));
      console.log("Parsed order data:", orderData);
      console.log("Parsed order items:", orderItems2);
      const createdOrder = await storage.createOrder(orderData, orderItems2);
      await storage.clearCart(req.userId);
      console.log("Order created successfully:", createdOrder.id);
      res.json(createdOrder);
    } catch (error) {
      console.error("Order creation error:", error);
      if (error instanceof Error) {
        if (error.message.includes("validation") || error.name === "ZodError") {
          return res.status(400).json({
            message: "Invalid order data",
            details: error.message
          });
        }
      }
      res.status(500).json({
        message: "Failed to create order",
        error: process.env.NODE_ENV === "development" ? error.message : void 0
      });
    }
  });
  app2.get("/api/orders/user", requireAuth, async (req, res) => {
    try {
      const orders2 = await storage.getUserOrders(req.userId);
      res.json(orders2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user orders" });
    }
  });
  app2.get("/api/orders/seller", requireAuth, async (req, res) => {
    try {
      const orders2 = await storage.getSellerOrders(req.userId);
      res.json(orders2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get seller orders" });
    }
  });
  app2.get("/api/orders/:orderId", requireAuth, async (req, res) => {
    try {
      const { orderId } = req.params;
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      if (order.buyerId !== req.userId && order.sellerId !== req.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to get order" });
    }
  });
  app2.put("/api/orders/:orderId/status", requireAuth, async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;
      const allowedStatuses = ["pending", "confirmed", "prepared", "delivered", "cancelled"];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const updatedOrder = await storage.updateOrderStatus(orderId, status, req.userId);
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });
  app2.put("/api/orders/:orderId/cancel", requireAuth, async (req, res) => {
    try {
      const { orderId } = req.params;
      const { reason } = req.body;
      if (!reason) {
        return res.status(400).json({ message: "Cancellation reason is required" });
      }
      const cancelledOrder = await storage.cancelOrder(orderId, reason);
      if (!cancelledOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(cancelledOrder);
    } catch (error) {
      res.status(500).json({ message: "Failed to cancel order" });
    }
  });
  app2.post("/api/verification-requests", requireAuth, async (req, res) => {
    try {
      const { requestType, reason, documents, storeId } = req.body;
      const verificationRequestData = {
        userId: req.userId,
        requestType,
        reason: reason || null,
        documents: documents || [],
        storeId: storeId || null,
        status: "pending",
        adminNote: null,
        reviewedBy: null
      };
      const verificationRequest = await storage.createVerificationRequest(verificationRequestData);
      res.json(verificationRequest);
    } catch (error) {
      res.status(500).json({ message: "Failed to create verification request" });
    }
  });
  app2.get("/api/user/verification-requests", requireAuth, async (req, res) => {
    try {
      const requests = await storage.getUserVerificationRequests(req.userId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to get verification requests" });
    }
  });
  app2.get("/api/verification-requests/:requestId", requireAuth, async (req, res) => {
    try {
      const { requestId } = req.params;
      const request = await storage.getVerificationRequest(requestId);
      if (!request) {
        return res.status(404).json({ message: "Verification request not found" });
      }
      res.json(request);
    } catch (error) {
      res.status(500).json({ message: "Failed to get verification request" });
    }
  });
  app2.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0648\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0645\u0637\u0644\u0648\u0628\u0627\u0646" });
      }
      const adminManager = new AdminManager(storage);
      if (!adminManager.validateCredentials(email, password)) {
        return res.status(401).json({ message: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0623\u0648 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629" });
      }
      console.log(`Admin login successful for: ${email}`);
      const adminUser = await adminManager.ensureAdminUser();
      if (!adminUser) {
        return res.status(500).json({ message: "\u0641\u0634\u0644 \u0641\u064A \u0625\u0646\u0634\u0627\u0621 \u0623\u0648 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0645\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0625\u062F\u0627\u0631\u0629" });
      }
      await adminManager.createSampleDataIfNeeded();
      adminManager.updateLastLogin();
      const sessionData = {
        userId: adminUser.id,
        token: `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3)
        // 30 days
      };
      const session = await storage.createSession(sessionData);
      res.json({
        token: session.token,
        user: adminUser,
        message: "\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0628\u0646\u062C\u0627\u062D"
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062E\u0627\u062F\u0645. \u062D\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649." });
    }
  });
  app2.get("/api/admin/dashboard-stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get dashboard stats" });
    }
  });
  app2.get("/api/admin/verification-requests", requireAdmin, async (req, res) => {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      const requests = await storage.getAllVerificationRequests(status);
      const startIndex = (Number(page) - 1) * Number(limit);
      const endIndex = startIndex + Number(limit);
      const paginatedRequests = requests.slice(startIndex, endIndex);
      res.json({
        requests: paginatedRequests,
        total: requests.length,
        page: Number(page),
        totalPages: Math.ceil(requests.length / Number(limit))
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get verification requests" });
    }
  });
  app2.get("/api/admin/orders", requireAdmin, async (req, res) => {
    try {
      const { status, search, page = 1, limit = 50 } = req.query;
      const orders2 = await storage.getAllOrders();
      let filteredOrders = orders2;
      if (status && status !== "all") {
        filteredOrders = filteredOrders.filter((order) => order.status === status);
      }
      if (search) {
        filteredOrders = filteredOrders.filter(
          (order) => order.id.includes(search) || order.customerName.toLowerCase().includes(search.toLowerCase()) || order.customerPhone.includes(search)
        );
      }
      const startIndex = (Number(page) - 1) * Number(limit);
      const endIndex = startIndex + Number(limit);
      const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
      res.json({
        orders: paginatedOrders,
        total: filteredOrders.length,
        page: Number(page),
        totalPages: Math.ceil(filteredOrders.length / Number(limit))
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get orders" });
    }
  });
  app2.put("/api/admin/orders/:orderId/status", requireAdmin, async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;
      const allowedStatuses = ["pending", "confirmed", "prepared", "delivered", "cancelled"];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const updatedOrder = await storage.updateOrderStatus(orderId, status, req.userId);
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });
  app2.put("/api/admin/verification-requests/:requestId", requireAdmin, async (req, res) => {
    try {
      const { requestId } = req.params;
      const { status, adminNote } = req.body;
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
      }
      const updatedRequest = await storage.updateVerificationRequestStatus(
        requestId,
        status,
        req.userId,
        adminNote
      );
      if (!updatedRequest) {
        return res.status(404).json({ message: "Verification request not found" });
      }
      res.json(updatedRequest);
    } catch (error) {
      res.status(500).json({ message: "Failed to update verification request" });
    }
  });
  app2.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const { page = 1, limit = 20, search, isVerified, isAdmin } = req.query;
      const users2 = await storage.getAllUsers();
      let filteredUsers = users2;
      if (search) {
        const searchTerm = search.toString().toLowerCase();
        filteredUsers = users2.filter(
          (user) => user.name.toLowerCase().includes(searchTerm) || user.phoneNumber.includes(searchTerm)
        );
      }
      if (isVerified !== void 0) {
        filteredUsers = filteredUsers.filter(
          (user) => user.isVerified === (isVerified === "true")
        );
      }
      if (isAdmin !== void 0) {
        filteredUsers = filteredUsers.filter(
          (user) => user.isAdmin === (isAdmin === "true")
        );
      }
      const startIndex = (Number(page) - 1) * Number(limit);
      const endIndex = startIndex + Number(limit);
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
      res.json({
        users: paginatedUsers,
        total: filteredUsers.length,
        page: Number(page),
        totalPages: Math.ceil(filteredUsers.length / Number(limit))
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get users" });
    }
  });
  app2.put("/api/admin/users/:userId/admin", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { isAdmin } = req.body;
      const updatedUser = await storage.updateUserAdminStatus(userId, isAdmin);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user admin status" });
    }
  });
  app2.put("/api/admin/users/:userId/verify", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { isVerified } = req.body;
      const updatedUser = await storage.updateUserVerificationStatus(userId, isVerified);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user verification status" });
    }
  });
  app2.get("/api/admin/stores", requireAdmin, async (req, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const stores2 = await storage.getAllStores();
      let filteredStores = stores2;
      if (status) {
        filteredStores = stores2.filter((store) => store.status === status);
      }
      const startIndex = (Number(page) - 1) * Number(limit);
      const endIndex = startIndex + Number(limit);
      const paginatedStores = filteredStores.slice(startIndex, endIndex);
      res.json({
        stores: paginatedStores,
        total: filteredStores.length,
        page: Number(page),
        totalPages: Math.ceil(filteredStores.length / Number(limit))
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get stores" });
    }
  });
  app2.put("/api/admin/stores/:storeId/status", requireAdmin, async (req, res) => {
    try {
      const { storeId } = req.params;
      const { status, rejectionReason } = req.body;
      if (!["approved", "rejected", "suspended"].includes(status)) {
        return res.status(400).json({ message: "Status must be 'approved', 'rejected', or 'suspended'" });
      }
      const updatedStore = await storage.updateStoreStatus(storeId, status, req.userId, rejectionReason);
      if (!updatedStore) {
        return res.status(404).json({ message: "Store not found" });
      }
      res.json(updatedStore);
    } catch (error) {
      res.status(500).json({ message: "Failed to update store status" });
    }
  });
  app2.get("/api/admin/orders", requireAdmin, async (req, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const orders2 = await storage.getAllOrders();
      let filteredOrders = orders2;
      if (status) {
        filteredOrders = orders2.filter((order) => order.status === status);
      }
      const startIndex = (Number(page) - 1) * Number(limit);
      const endIndex = startIndex + Number(limit);
      const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
      res.json({
        orders: paginatedOrders,
        total: filteredOrders.length,
        page: Number(page),
        totalPages: Math.ceil(filteredOrders.length / Number(limit))
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get orders" });
    }
  });
  app2.post("/api/admin/update-credentials", requireAdmin, async (req, res) => {
    try {
      const { currentPassword, newEmail, newPassword } = req.body;
      if (!currentPassword || !newEmail || !newPassword) {
        return res.status(400).json({ message: "\u062C\u0645\u064A\u0639 \u0627\u0644\u062D\u0642\u0648\u0644 \u0645\u0637\u0644\u0648\u0628\u0629" });
      }
      const storedCredentials = await storage.getAdminCredentials();
      const currentAdminPassword = storedCredentials?.password || process.env.ADMIN_PASSWORD;
      if (!currentAdminPassword) {
        return res.status(500).json({ message: "\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u063A\u064A\u0631 \u0645\u0643\u062A\u0645\u0644\u0629" });
      }
      if (currentPassword !== currentAdminPassword) {
        return res.status(401).json({ message: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062D\u0627\u0644\u064A\u0629 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629" });
      }
      await storage.updateAdminCredentials({
        email: newEmail,
        password: newPassword
      });
      res.json({
        message: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0628\u0646\u062C\u0627\u062D! \u064A\u0645\u0643\u0646\u0643 \u0627\u0644\u0622\u0646 \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u0625\u064A\u0645\u064A\u0644 \u0648\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629 \u0644\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644.",
        newEmail,
        note: "\u062A\u0645 \u062D\u0641\u0638 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062C\u062F\u064A\u062F\u0629 \u0628\u0646\u062C\u0627\u062D"
      });
    } catch (error) {
      res.status(500).json({ message: "\u0641\u0634\u0644 \u0641\u064A \u062A\u062D\u062F\u064A\u062B \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0627\u0639\u062A\u0645\u0627\u062F" });
    }
  });
  app2.get("/api/admin/dashboard-stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get dashboard stats" });
    }
  });
  app2.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const { search, isVerified, isAdmin, page = 1, limit = 50 } = req.query;
      let users2 = await storage.getAllUsers();
      if (search) {
        const searchTerm = search.toString().toLowerCase();
        users2 = users2.filter(
          (user) => user.name.toLowerCase().includes(searchTerm) || user.phoneNumber.includes(searchTerm)
        );
      }
      if (isVerified !== void 0) {
        const isVerifiedBool = isVerified === "true";
        users2 = users2.filter((user) => user.isVerified === isVerifiedBool);
      }
      if (isAdmin !== void 0) {
        const isAdminBool = isAdmin === "true";
        users2 = users2.filter((user) => user.isAdmin === isAdminBool);
      }
      const startIndex = (Number(page) - 1) * Number(limit);
      const endIndex = startIndex + Number(limit);
      const paginatedUsers = users2.slice(startIndex, endIndex);
      res.json({
        users: paginatedUsers,
        total: users2.length,
        page: Number(page),
        totalPages: Math.ceil(users2.length / Number(limit))
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get users" });
    }
  });
  app2.put("/api/admin/users/:userId/admin", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { isAdmin } = req.body;
      if (typeof isAdmin !== "boolean") {
        return res.status(400).json({ message: "isAdmin must be a boolean" });
      }
      const updatedUser = await storage.updateUserAdminStatus(userId, isAdmin);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user admin status" });
    }
  });
  app2.put("/api/admin/users/:userId/verify", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { isVerified } = req.body;
      if (typeof isVerified !== "boolean") {
        return res.status(400).json({ message: "isVerified must be a boolean" });
      }
      const updatedUser = await storage.updateUserVerificationStatus(userId, isVerified);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user verification status" });
    }
  });
  app2.get("/api/admin/verification-requests", requireAdmin, async (req, res) => {
    try {
      const { status, page = 1, limit = 50 } = req.query;
      let requests = await storage.getAllVerificationRequests(status ? status.toString() : void 0);
      const startIndex = (Number(page) - 1) * Number(limit);
      const endIndex = startIndex + Number(limit);
      const paginatedRequests = requests.slice(startIndex, endIndex);
      res.json({
        requests: paginatedRequests,
        total: requests.length,
        page: Number(page),
        totalPages: Math.ceil(requests.length / Number(limit))
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get verification requests" });
    }
  });
  app2.put("/api/admin/verification-requests/:requestId", requireAdmin, async (req, res) => {
    try {
      const { requestId } = req.params;
      const { status, adminNote } = req.body;
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
      }
      const updatedRequest = await storage.updateVerificationRequestStatus(
        requestId,
        status,
        adminNote,
        req.userId
      );
      if (!updatedRequest) {
        return res.status(404).json({ message: "Verification request not found" });
      }
      res.json(updatedRequest);
    } catch (error) {
      res.status(500).json({ message: "Failed to update verification request" });
    }
  });
  app2.get("/api/stickers", async (req, res) => {
    try {
      const stickers2 = await storage.getAllStickers();
      res.json(stickers2);
    } catch (error) {
      console.error("Error fetching stickers:", error);
      res.status(500).json({ error: "Failed to fetch stickers" });
    }
  });
  app2.get("/api/stickers/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const stickers2 = await storage.getStickersByCategory(category);
      res.json(stickers2);
    } catch (error) {
      console.error("Error fetching stickers by category:", error);
      res.status(500).json({ error: "Failed to fetch stickers" });
    }
  });
  app2.get("/api/features", async (req, res) => {
    try {
      const features = await storage.getAllFeatures();
      res.json(features);
    } catch (error) {
      console.error("Get features error:", error);
      res.status(500).json({ message: "\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062E\u0627\u062F\u0645" });
    }
  });
  app2.get("/api/features/:featureId", async (req, res) => {
    try {
      const { featureId } = req.params;
      const feature = await storage.getFeature(featureId);
      if (!feature) {
        return res.status(404).json({ message: "\u0627\u0644\u0645\u064A\u0632\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629" });
      }
      res.json(feature);
    } catch (error) {
      console.error("Get feature error:", error);
      res.status(500).json({ message: "\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062E\u0627\u062F\u0645" });
    }
  });
  app2.put("/api/admin/features/:featureId", requireAdmin, async (req, res) => {
    try {
      const { featureId } = req.params;
      const { isEnabled, name, description, category, priority } = req.body;
      const feature = await storage.updateFeature(featureId, {
        isEnabled,
        name,
        description,
        category,
        priority
      });
      if (!feature) {
        return res.status(404).json({ message: "\u0627\u0644\u0645\u064A\u0632\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629" });
      }
      res.json({
        message: `\u062A\u0645 ${isEnabled ? "\u062A\u0641\u0639\u064A\u0644" : "\u0625\u064A\u0642\u0627\u0641"} \u0627\u0644\u0645\u064A\u0632\u0629 \u0628\u0646\u062C\u0627\u062D`,
        feature
      });
    } catch (error) {
      console.error("Update feature error:", error);
      res.status(500).json({ message: "\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062E\u0627\u062F\u0645" });
    }
  });
  app2.get("/api/admin/features", requireAdmin, async (req, res) => {
    try {
      const features = await storage.getAllFeatures();
      res.json(features);
    } catch (error) {
      console.error("Get admin features error:", error);
      res.status(500).json({ message: "\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062E\u0627\u062F\u0645" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express2 from "express";
import fs3 from "fs";
import path4 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path3 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path3.resolve(import.meta.dirname, "client", "src"),
      "@shared": path3.resolve(import.meta.dirname, "shared"),
      "@assets": path3.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path3.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path3.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path4.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs3.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path4.resolve(import.meta.dirname, "public");
  if (!fs3.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path4.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path5 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path5.startsWith("/api")) {
      let logLine = `${req.method} ${path5} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  try {
    console.log("Initializing default app features...");
    await storage.initializeDefaultFeatures();
    console.log("App features initialized successfully");
  } catch (error) {
    console.error("Warning: Failed to initialize default features:", error);
  }
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
