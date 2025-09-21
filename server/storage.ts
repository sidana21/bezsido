import { 
  type User, 
  type InsertUser, 
  type Chat, 
  type InsertChat, 
  type Message, 
  type InsertMessage, 
  type Story, 
  type InsertStory, 
  type Session, 
  type InsertSession, 
  type OtpCode, 
  type InsertOtp,
  type Store,
  type InsertStore,
  type Product,
  type InsertProduct,
  type AffiliateLink,
  type InsertAffiliateLink,
  type Commission,
  type InsertCommission,
  type Contact,
  type InsertContact,
  type CartItem,
  type InsertCartItem,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type VerificationRequest,
  type InsertVerificationRequest,
  type StoryLike,
  type InsertStoryLike,
  type StoryComment,
  type InsertStoryComment,
  type Sticker,
  type InsertSticker,
  type AdminCredentials,
  type InsertAdminCredentials,
  type AppFeature,
  type InsertAppFeature,
  type Call,
  type InsertCall,
  type NeighborhoodGroup,
  type InsertNeighborhoodGroup,
  type HelpRequest,
  type InsertHelpRequest,
  type PointTransaction,
  type InsertPointTransaction,
  type DailyMission,
  type InsertDailyMission,
  type UserMission,
  type InsertUserMission,
  type Reminder,
  type InsertReminder,
  type CustomerTag,
  type InsertCustomerTag,
  type QuickReply,
  type InsertQuickReply
} from "@shared/schema";
import { randomUUID } from "crypto";
import { adminCredentials, appFeatures, users, sessions, chats, messages, otpCodes, stories, storyLikes, storyComments, stores, verificationRequests, cartItems, stickers, products, affiliateLinks, commissions, contacts, orders, orderItems, calls, neighborhoodGroups, helpRequests, pointTransactions, dailyMissions, userMissions, reminders, customerTags, quickReplies } from '@shared/schema';
import { sql } from 'drizzle-orm';
import { eq, and } from 'drizzle-orm';

// Database connection will be imported conditionally when needed
let db: any = null;

export interface IStorage {
  // Call management
  createCall(callData: any): Promise<any>;
  getCallById(callId: string): Promise<any>;
  updateCallStatus(callId: string, status: string): Promise<any>;
  endCall(callId: string, duration?: number): Promise<any>;
  getActiveCallsForUser(userId: string): Promise<any[]>;
  getCallHistoryForUser(userId: string): Promise<any[]>;
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined>;
  updateUserOnlineStatus(id: string, isOnline: boolean): Promise<void>;
  deleteUser(id: string): Promise<boolean>;
  
  // Authentication
  createOtpCode(otp: InsertOtp): Promise<OtpCode>;
  verifyOtpCode(email: string, code: string): Promise<boolean>;
  createSession(session: InsertSession): Promise<Session>;
  getSessionByToken(token: string): Promise<Session | undefined>;
  deleteSession(token: string): Promise<void>;
  
  // Signup tokens for secure user creation
  createSignupToken(email: string): Promise<string>;
  validateAndConsumeSignupToken(token: string, email: string): Promise<boolean>;
  cleanupExpiredSignupTokens(): Promise<void>;
  
  // Chats
  getChat(id: string): Promise<Chat | undefined>;
  getUserChats(userId: string): Promise<Chat[]>;
  createChat(chat: InsertChat): Promise<Chat>;
  deleteChat(id: string): Promise<boolean>;
  
  // Messages
  getChatMessages(chatId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(messageId: string): Promise<void>;
  markMessageAsDelivered(messageId: string): Promise<void>;
  searchMessages(chatId: string, searchTerm: string): Promise<Message[]>;
  updateMessage(messageId: string, content: string): Promise<Message | undefined>;
  deleteMessage(messageId: string): Promise<void>;
  
  // Stories
  getActiveStories(): Promise<(Story & { user: User })[]>;
  getUserStories(userId: string): Promise<Story[]>;
  createStory(story: InsertStory): Promise<Story>;
  viewStory(storyId: string, viewerId: string): Promise<void>;
  getStory(storyId: string): Promise<Story | undefined>;
  
  // Story interactions
  likeStory(storyId: string, userId: string, reactionType: string): Promise<StoryLike>;
  unlikeStory(storyId: string, userId: string): Promise<void>;
  getStoryLikes(storyId: string): Promise<(StoryLike & { user: User })[]>;
  getStoryLikeCount(storyId: string): Promise<number>;
  hasUserLikedStory(storyId: string, userId: string): Promise<boolean>;
  addStoryComment(storyId: string, userId: string, content: string): Promise<StoryComment>;
  getStoryComments(storyId: string): Promise<(StoryComment & { user: User })[]>;
  getStoryCommentCount(storyId: string): Promise<number>;
  updateStoryComment(commentId: string, content: string): Promise<StoryComment | undefined>;
  deleteStoryComment(commentId: string): Promise<boolean>;
  
  // Admin Features
  getAdminCredentials(): Promise<AdminCredentials | undefined>;
  updateAdminCredentials(credentials: InsertAdminCredentials): Promise<AdminCredentials>;
  
  // Stickers
  getAllStickers(): Promise<any[]>;
  
  // Cart functionality
  getCartItems(userId: string): Promise<any[]>;
  addToCart(userId: string, productId: string, quantity: number): Promise<any>;
  removeFromCart(userId: string, cartItemId: string): Promise<void>;
  updateCartItemQuantity(userId: string, cartItemId: string, quantity: number): Promise<any>;
  getAllFeatures(): Promise<AppFeature[]>;
  getFeature(featureId: string): Promise<AppFeature | undefined>;
  updateFeature(featureId: string, updates: Partial<InsertAppFeature>): Promise<AppFeature | undefined>;
  initializeDefaultFeatures(): Promise<void>;
  initializeDefaultStickers(): Promise<void>;
  
  // Admin management methods
  getAllUsers(): Promise<User[]>;
  updateUserAdminStatus(userId: string, isAdmin: boolean): Promise<User | undefined>;
  updateUserVerificationStatus(userId: string, isVerified: boolean): Promise<User | undefined>;
  
  // Verification requests
  createVerificationRequest(request: InsertVerificationRequest): Promise<VerificationRequest>;
  getVerificationRequests(userId?: string): Promise<VerificationRequest[]>;
  getUserVerificationRequests(userId: string): Promise<VerificationRequest[]>;
  getVerificationRequest(requestId: string): Promise<VerificationRequest | undefined>;
  getAllVerificationRequests(status?: string): Promise<VerificationRequest[]>;
  updateVerificationRequest(requestId: string, updates: Partial<Pick<VerificationRequest, 'status' | 'adminNote' | 'reviewedBy'>>): Promise<VerificationRequest | undefined>;
  
  // Stores and products
  getStores(location?: string, category?: string): Promise<Store[]>;
  getAllStores(): Promise<Store[]>;
  getStore(storeId: string): Promise<Store | undefined>;
  getUserStore(userId: string): Promise<Store | undefined>;
  createStore(store: InsertStore): Promise<Store>;
  updateStore(storeId: string, updates: Partial<InsertStore>): Promise<Store | undefined>;
  updateStoreStatus(storeId: string, status: string, reviewedBy: string, rejectionReason?: string): Promise<Store | undefined>;
  deleteStore(storeId: string): Promise<boolean>;
  getStoreProducts(storeId: string): Promise<Product[]>;
  getUserProducts(userId: string): Promise<Product[]>;
  
  // Products
  getProducts(location?: string, category?: string): Promise<Product[]>;
  getProduct(productId: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(productId: string, updates: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(productId: string): Promise<boolean>;
  
  // Affiliate links
  createAffiliateLink(affiliateLink: InsertAffiliateLink): Promise<AffiliateLink>;
  getUserAffiliateLinks(userId: string): Promise<AffiliateLink[]>;
  getAffiliateLink(uniqueCode: string): Promise<AffiliateLink | undefined>;
  trackClick(uniqueCode: string): Promise<void>;
  trackConversion(uniqueCode: string, buyerId: string, amount: number): Promise<void>;
  
  // Commissions
  getUserCommissions(userId: string): Promise<Commission[]>;
  getTotalCommissions(userId: string): Promise<{ total: number; pending: number; paid: number }>;
  getCommissionsByStatus(status: string): Promise<Commission[]>;
  
  // Contacts
  getUserContacts(userId: string): Promise<Contact[]>;
  addContact(contact: InsertContact): Promise<Contact>;
  searchUserByPhoneNumber(phoneNumber: string): Promise<User | undefined>;
  
  // Orders
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  getUserOrders(userId: string): Promise<Order[]>;
  getSellerOrders(sellerId: string): Promise<Order[]>;
  getOrder(orderId: string): Promise<Order | undefined>;
  updateOrderStatus(orderId: string, status: string, updatedBy: string): Promise<Order | undefined>;
  cancelOrder(orderId: string, reason: string): Promise<Order | undefined>;
  getAllOrders(): Promise<Order[]>;
  clearCart(userId: string): Promise<void>;
  
  // Stickers
  getStickersByCategory(category?: string): Promise<Sticker[]>;
  
  // Admin dashboard stats
  getAdminDashboardStats(): Promise<any>;
  
  // Neighborhood Groups - مجموعات الحي
  getNeighborhoodGroups(location?: string): Promise<NeighborhoodGroup[]>;
  getNeighborhoodGroup(groupId: string): Promise<NeighborhoodGroup | undefined>;
  createNeighborhoodGroup(group: InsertNeighborhoodGroup): Promise<NeighborhoodGroup>;
  joinNeighborhoodGroup(groupId: string, userId: string): Promise<void>;
  leaveNeighborhoodGroup(groupId: string, userId: string): Promise<void>;
  getUserNeighborhoodGroups(userId: string): Promise<NeighborhoodGroup[]>;
  
  // Help Requests - طلبات المساعدة
  getHelpRequests(groupId?: string, status?: string): Promise<HelpRequest[]>;
  getHelpRequest(requestId: string): Promise<HelpRequest | undefined>;
  createHelpRequest(request: InsertHelpRequest): Promise<HelpRequest>;
  acceptHelpRequest(requestId: string, helperId: string): Promise<HelpRequest | undefined>;
  completeHelpRequest(requestId: string, rating?: number, feedback?: string): Promise<HelpRequest | undefined>;
  cancelHelpRequest(requestId: string): Promise<HelpRequest | undefined>;
  getUserHelpRequests(userId: string): Promise<HelpRequest[]>;
  getUserHelperRequests(helperId: string): Promise<HelpRequest[]>;
  
  // Points System - نظام النقاط
  getUserPoints(userId: string): Promise<number>;
  addPoints(userId: string, points: number, reason: string, relatedId?: string, relatedType?: string): Promise<void>;
  deductPoints(userId: string, points: number, reason: string, relatedId?: string, relatedType?: string): Promise<void>;
  getPointTransactions(userId: string): Promise<PointTransaction[]>;
  updateUserStreak(userId: string): Promise<void>;
  getTopUsers(limit?: number): Promise<User[]>;
  
  // Daily Missions - المهام اليومية
  getDailyMissions(category?: string): Promise<DailyMission[]>;
  getUserDailyMissions(userId: string, date: string): Promise<UserMission[]>;
  updateMissionProgress(userId: string, missionId: string, increment?: number): Promise<UserMission | undefined>;
  completeMission(userId: string, missionId: string): Promise<UserMission | undefined>;
  initializeDailyMissions(): Promise<void>;
  resetDailyMissions(userId: string, date: string): Promise<void>;
  
  // Reminders - التذكيرات
  getReminders(userId: string): Promise<Reminder[]>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  markReminderComplete(reminderId: string): Promise<void>;
  getDueReminders(): Promise<Reminder[]>;
  deleteReminder(reminderId: string): Promise<void>;
  
  // Customer Tags - تصنيفات العملاء
  getCustomerTags(userId: string): Promise<CustomerTag[]>;
  getContactTag(userId: string, contactId: string): Promise<CustomerTag | undefined>;
  setCustomerTag(tag: InsertCustomerTag): Promise<CustomerTag>;
  updateCustomerTag(tagId: string, updates: Partial<InsertCustomerTag>): Promise<CustomerTag | undefined>;
  deleteCustomerTag(tagId: string): Promise<void>;
  
  // Quick Replies - الردود السريعة
  getQuickReplies(userId: string, category?: string): Promise<QuickReply[]>;
  createQuickReply(reply: InsertQuickReply): Promise<QuickReply>;
  updateQuickReply(replyId: string, updates: Partial<InsertQuickReply>): Promise<QuickReply | undefined>;
  incrementQuickReplyUsage(replyId: string): Promise<void>;
  deleteQuickReply(replyId: string): Promise<void>;
}

// Database Storage Implementation - uses PostgreSQL database
export class DatabaseStorage implements IStorage {
  // In-memory storage for short-lived signupTokens (5 min expiry)
  private signupTokens = new Map<string, { email: string; token: string; expiresAt: Date }>();
  async getUser(id: string): Promise<User | undefined> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      console.log('Creating user with data:', user);
      
      const newUser = {
        id: randomUUID(),
        ...user,
        isOnline: user.isOnline ?? false,
        isVerified: user.isVerified ?? false,
        verifiedAt: user.verifiedAt || null,
        isAdmin: user.isAdmin ?? false,
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.insert(users).values(newUser).returning();
      console.log('User created successfully:', result[0].id);
      return result[0];
    } catch (error) {
      console.error('Error creating user:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        constraint: error.constraint
      });
      throw new Error(`فشل في إنشاء المستخدم: ${error.message}`);
    }
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.update(users)
        .set({ ...userData, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      return result[0] || undefined;
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  async updateUserOnlineStatus(id: string, isOnline: boolean): Promise<void> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      await db.update(users)
        .set({ 
          isOnline, 
          lastSeen: new Date(),
          updatedAt: new Date() 
        })
        .where(eq(users.id, id));
    } catch (error) {
      console.error('Error updating user online status:', error);
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      await db.delete(users).where(eq(users.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  // Authentication methods
  async createOtpCode(otp: InsertOtp): Promise<OtpCode> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const newOtp = {
        id: randomUUID(),
        ...otp,
        createdAt: new Date(),
      };

      const result = await db.insert(otpCodes).values(newOtp).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating OTP code:', error);
      throw error;
    }
  }

  async verifyOtpCode(email: string, code: string): Promise<boolean> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.select().from(otpCodes)
        .where(and(
          eq(otpCodes.email, email),
          eq(otpCodes.code, code),
          eq(otpCodes.isUsed, false)
        ))
        .limit(1);

      if (result.length === 0) return false;

      const otpRecord = result[0];
      if (otpRecord.expiresAt < new Date()) {
        return false;
      }

      // Mark as used
      await db.update(otpCodes)
        .set({ isUsed: true })
        .where(eq(otpCodes.id, otpRecord.id));

      return true;
    } catch (error) {
      console.error('Error verifying OTP code:', error);
      return false;
    }
  }

  async createSession(session: InsertSession): Promise<Session> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const newSession = {
        id: randomUUID(),
        ...session,
        createdAt: new Date(),
      };

      const result = await db.insert(sessions).values(newSession).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async getSessionByToken(token: string): Promise<Session | undefined> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting session by token:', error);
      return undefined;
    }
  }

  async deleteSession(token: string): Promise<void> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      await db.delete(sessions).where(eq(sessions.token, token));
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }

  // Signup token methods for secure user creation
  async createSignupToken(email: string): Promise<string> {
    const token = randomUUID();
    const tokenData = {
      email: email.toLowerCase().trim(),
      token,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    };
    
    this.signupTokens.set(token, tokenData);
    
    // Auto cleanup expired tokens
    setTimeout(() => this.cleanupExpiredSignupTokens(), 5 * 60 * 1000);
    
    return token;
  }

  async validateAndConsumeSignupToken(token: string, email: string): Promise<boolean> {
    const tokenData = this.signupTokens.get(token);
    
    if (!tokenData) {
      return false;
    }
    
    if (tokenData.expiresAt < new Date()) {
      this.signupTokens.delete(token);
      return false;
    }
    
    if (tokenData.email !== email.toLowerCase().trim()) {
      return false;
    }
    
    // Consume the token (one-time use)
    this.signupTokens.delete(token);
    return true;
  }

  async cleanupExpiredSignupTokens(): Promise<void> {
    const now = new Date();
    for (const [token, tokenData] of this.signupTokens.entries()) {
      if (tokenData.expiresAt < now) {
        this.signupTokens.delete(token);
      }
    }
  }

  // Chat methods
  async getChat(id: string): Promise<Chat | undefined> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.select().from(chats).where(eq(chats.id, id)).limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting chat:', error);
      return undefined;
    }
  }

  async getUserChats(userId: string): Promise<Chat[]> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.select().from(chats)
        .where(sql`${chats.participants} @> ${JSON.stringify([userId])}`);
      return result;
    } catch (error) {
      console.error('Error getting user chats:', error);
      return [];
    }
  }

  async createChat(chat: InsertChat): Promise<Chat> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const newChat = {
        id: randomUUID(),
        ...chat,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.insert(chats).values(newChat).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  }

  async deleteChat(id: string): Promise<boolean> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      await db.delete(chats).where(eq(chats.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting chat:', error);
      return false;
    }
  }

  // Message methods
  async getChatMessages(chatId: string): Promise<Message[]> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.select().from(messages)
        .where(eq(messages.chatId, chatId))
        .orderBy(messages.timestamp);
      return result;
    } catch (error) {
      console.error('Error getting chat messages:', error);
      return [];
    }
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const newMessage = {
        id: randomUUID(),
        ...message,
        timestamp: new Date(),
      };

      const result = await db.insert(messages).values(newMessage).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      await db.update(messages)
        .set({ isRead: true })
        .where(eq(messages.id, messageId));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  async markMessageAsDelivered(messageId: string): Promise<void> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      await db.update(messages)
        .set({ isDelivered: true })
        .where(eq(messages.id, messageId));
    } catch (error) {
      console.error('Error marking message as delivered:', error);
    }
  }

  async searchMessages(chatId: string, searchTerm: string): Promise<Message[]> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.select().from(messages)
        .where(and(
          eq(messages.chatId, chatId),
          sql`${messages.content} ILIKE ${`%${searchTerm}%`}`
        ));
      return result;
    } catch (error) {
      console.error('Error searching messages:', error);
      return [];
    }
  }

  async updateMessage(messageId: string, content: string): Promise<Message | undefined> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.update(messages)
        .set({ 
          content, 
          isEdited: true,
          editedAt: new Date()
        })
        .where(eq(messages.id, messageId))
        .returning();
      return result[0] || undefined;
    } catch (error) {
      console.error('Error updating message:', error);
      return undefined;
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      await db.update(messages)
        .set({ deletedAt: new Date() })
        .where(eq(messages.id, messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }

  // Story methods
  async getActiveStories(): Promise<(Story & { user: User })[]> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.select({
        id: stories.id,
        userId: stories.userId,
        location: stories.location,
        content: stories.content,
        imageUrl: stories.imageUrl,
        videoUrl: stories.videoUrl,
        backgroundColor: stories.backgroundColor,
        textColor: stories.textColor,
        timestamp: stories.timestamp,
        expiresAt: stories.expiresAt,
        viewCount: stories.viewCount,
        viewers: stories.viewers,
        user: users,
      })
      .from(stories)
      .leftJoin(users, eq(stories.userId, users.id))
      .where(sql`${stories.expiresAt} > NOW()`);
      
      return result.map(row => ({
        id: row.id,
        userId: row.userId,
        location: row.location,
        content: row.content,
        imageUrl: row.imageUrl,
        videoUrl: row.videoUrl,
        backgroundColor: row.backgroundColor,
        textColor: row.textColor,
        timestamp: row.timestamp,
        expiresAt: row.expiresAt,
        viewCount: row.viewCount,
        viewers: row.viewers,
        user: row.user,
      })).filter(story => story.user);
    } catch (error) {
      console.error('Error getting active stories:', error);
      return [];
    }
  }

  async getUserStories(userId: string): Promise<Story[]> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.select().from(stories)
        .where(eq(stories.userId, userId))
        .orderBy(sql`${stories.timestamp} DESC`);
      return result;
    } catch (error) {
      console.error('Error getting user stories:', error);
      return [];
    }
  }

  async createStory(story: InsertStory): Promise<Story> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const newStory = {
        id: randomUUID(),
        ...story,
        timestamp: new Date(),
        viewCount: "0",
        viewers: [],
      };

      const result = await db.insert(stories).values(newStory).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating story:', error);
      throw error;
    }
  }

  async viewStory(storyId: string, viewerId: string): Promise<void> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      // Get current story
      const storyResult = await db.select().from(stories).where(eq(stories.id, storyId)).limit(1);
      if (!storyResult.length) return;
      
      const story = storyResult[0];
      const viewers = story.viewers || [];
      
      if (!viewers.includes(viewerId)) {
        const updatedViewers = [...viewers, viewerId];
        const newViewCount = (parseInt(story.viewCount) + 1).toString();
        
        await db.update(stories)
          .set({ 
            viewers: updatedViewers,
            viewCount: newViewCount
          })
          .where(eq(stories.id, storyId));
      }
    } catch (error) {
      console.error('Error viewing story:', error);
    }
  }

  async getStory(storyId: string): Promise<Story | undefined> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.select().from(stories).where(eq(stories.id, storyId)).limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting story:', error);
      return undefined;
    }
  }

  // Story interactions implementation
  async likeStory(storyId: string, userId: string, reactionType: string): Promise<StoryLike> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const newLike = {
        id: randomUUID(),
        storyId,
        userId,
        reactionType,
        timestamp: new Date(),
      };

      const result = await db.insert(storyLikes).values(newLike).returning();
      return result[0];
    } catch (error) {
      console.error('Error liking story:', error);
      throw error;
    }
  }

  async unlikeStory(storyId: string, userId: string): Promise<void> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      await db.delete(storyLikes)
        .where(and(
          eq(storyLikes.storyId, storyId),
          eq(storyLikes.userId, userId)
        ));
    } catch (error) {
      console.error('Error unliking story:', error);
    }
  }

  async getStoryLikes(storyId: string): Promise<(StoryLike & { user: User })[]> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.select({
        id: storyLikes.id,
        storyId: storyLikes.storyId,
        userId: storyLikes.userId,
        reactionType: storyLikes.reactionType,
        timestamp: storyLikes.timestamp,
        user: users,
      })
      .from(storyLikes)
      .leftJoin(users, eq(storyLikes.userId, users.id))
      .where(eq(storyLikes.storyId, storyId));
      
      return result.map(row => ({
        id: row.id,
        storyId: row.storyId,
        userId: row.userId,
        reactionType: row.reactionType,
        timestamp: row.timestamp,
        user: row.user!,
      }));
    } catch (error) {
      console.error('Error getting story likes:', error);
      return [];
    }
  }

  async getStoryLikeCount(storyId: string): Promise<number> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(storyLikes)
        .where(eq(storyLikes.storyId, storyId));
      
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting story like count:', error);
      return 0;
    }
  }

  async hasUserLikedStory(storyId: string, userId: string): Promise<boolean> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.select()
        .from(storyLikes)
        .where(and(
          eq(storyLikes.storyId, storyId),
          eq(storyLikes.userId, userId)
        ))
        .limit(1);
      
      return result.length > 0;
    } catch (error) {
      console.error('Error checking if user liked story:', error);
      return false;
    }
  }

  async addStoryComment(storyId: string, userId: string, content: string): Promise<StoryComment> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const newComment = {
        id: randomUUID(),
        storyId,
        userId,
        content,
        timestamp: new Date(),
      };

      const result = await db.insert(storyComments).values(newComment).returning();
      return result[0];
    } catch (error) {
      console.error('Error adding story comment:', error);
      throw error;
    }
  }

  async getStoryComments(storyId: string): Promise<(StoryComment & { user: User })[]> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.select({
        id: storyComments.id,
        storyId: storyComments.storyId,
        userId: storyComments.userId,
        content: storyComments.content,
        timestamp: storyComments.timestamp,
        user: users,
      })
      .from(storyComments)
      .leftJoin(users, eq(storyComments.userId, users.id))
      .where(eq(storyComments.storyId, storyId))
      .orderBy(storyComments.timestamp);
      
      return result.map(row => ({
        id: row.id,
        storyId: row.storyId,
        userId: row.userId,
        content: row.content,
        timestamp: row.timestamp,
        user: row.user!,
      }));
    } catch (error) {
      console.error('Error getting story comments:', error);
      return [];
    }
  }

  async getStoryCommentCount(storyId: string): Promise<number> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(storyComments)
        .where(eq(storyComments.storyId, storyId));
      
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting story comment count:', error);
      return 0;
    }
  }

  async updateStoryComment(commentId: string, content: string): Promise<StoryComment | undefined> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.update(storyComments)
        .set({ content })
        .where(eq(storyComments.id, commentId))
        .returning();
      
      return result[0] || undefined;
    } catch (error) {
      console.error('Error updating story comment:', error);
      return undefined;
    }
  }

  async deleteStoryComment(commentId: string): Promise<boolean> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.delete(storyComments)
        .where(eq(storyComments.id, commentId));
      
      return true;
    } catch (error) {
      console.error('Error deleting story comment:', error);
      return false;
    }
  }

  // Admin methods
  async getAdminCredentials(): Promise<AdminCredentials | undefined> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.select().from(adminCredentials).where(eq(adminCredentials.id, 'admin_settings')).limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting admin credentials:', error);
      return undefined;
    }
  }

  async updateAdminCredentials(credentials: InsertAdminCredentials): Promise<AdminCredentials> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const adminCreds = {
        id: "admin_settings" as const,
        email: credentials.email,
        password: credentials.password,
        updatedAt: new Date(),
        createdAt: new Date(),
      };
      
      const result = await db.insert(adminCredentials)
        .values(adminCreds)
        .onConflictDoUpdate({
          target: adminCredentials.id,
          set: {
            email: credentials.email,
            password: credentials.password,
            updatedAt: new Date(),
          }
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating admin credentials:', error);
      throw error;
    }
  }

  // Stickers implementation for DatabaseStorage
  async getAllStickers(): Promise<any[]> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.select().from(stickers);
      return result;
    } catch (error) {
      console.error('Error getting stickers:', error);
      return [];
    }
  }
  
  // Cart implementation for DatabaseStorage
  async getCartItems(userId: string): Promise<any[]> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.select().from(cartItems).where(eq(cartItems.userId, userId));
      return result;
    } catch (error) {
      console.error('Error getting cart items:', error);
      return [];
    }
  }
  
  async addToCart(userId: string, productId: string, quantity: number): Promise<any> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const newCartItem = {
        id: randomUUID(),
        userId,
        productId,
        quantity,
        addedAt: new Date(),
      };

      const result = await db.insert(cartItems).values(newCartItem).returning();
      return result[0];
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  }
  
  async removeFromCart(userId: string, cartItemId: string): Promise<void> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      await db.delete(cartItems)
        .where(and(
          eq(cartItems.id, cartItemId),
          eq(cartItems.userId, userId)
        ));
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  }
  
  async updateCartItemQuantity(userId: string, cartItemId: string, quantity: number): Promise<any> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.update(cartItems)
        .set({ quantity })
        .where(and(
          eq(cartItems.id, cartItemId),
          eq(cartItems.userId, userId)
        ))
        .returning();
      
      return result[0] || undefined;
    } catch (error) {
      console.error('Error updating cart item quantity:', error);
      return undefined;
    }
  }

  async getAllFeatures(): Promise<AppFeature[]> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.select().from(appFeatures).orderBy(appFeatures.priority);
      return result;
    } catch (error) {
      console.error('Error getting all features:', error);
      return [];
    }
  }

  async getFeature(featureId: string): Promise<AppFeature | undefined> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.select().from(appFeatures).where(eq(appFeatures.id, featureId)).limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting feature:', error);
      return undefined;
    }
  }

  async updateFeature(featureId: string, updates: Partial<InsertAppFeature>): Promise<AppFeature | undefined> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.update(appFeatures)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(appFeatures.id, featureId))
        .returning();
      return result[0] || undefined;
    } catch (error) {
      console.error('Error updating feature:', error);
      return undefined;
    }
  }

  async initializeDefaultFeatures(): Promise<void> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }

      console.log('Initializing default app features...');
      
      const defaultFeatures: InsertAppFeature[] = [
        { id: "messaging", name: "المراسلة", description: "إرسال واستقبال الرسائل الفورية", isEnabled: true, category: "messaging", priority: 1 },
        { id: "stories", name: "الحالات", description: "مشاركة الحالات والقصص", isEnabled: true, category: "social", priority: 2 },
        { id: "marketplace", name: "السوق", description: "بيع وشراء المنتجات", isEnabled: true, category: "marketplace", priority: 3 },
        { id: "stores", name: "المتاجر", description: "إنشاء وإدارة المتاجر", isEnabled: true, category: "marketplace", priority: 4 },
        { id: "neighborhoods", name: "مجتمع الحي", description: "التواصل مع الجيران وطلب المساعدة", isEnabled: true, category: "social", priority: 5 },
        { id: "affiliate", name: "التسويق بالعمولة", description: "كسب المال من خلال التسويق", isEnabled: true, category: "marketplace", priority: 6 },
        { id: "verification", name: "التوثيق", description: "توثيق الحسابات والمتاجر", isEnabled: true, category: "admin", priority: 7 },
      ];

      for (const feature of defaultFeatures) {
        await db.insert(appFeatures)
          .values({ 
            ...feature,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .onConflictDoNothing();
      }

      console.log('Default features initialized in database');
    } catch (error) {
      console.error('Error initializing default features:', error);
      // Don't throw - this is not critical
    }
  }

  // Admin management methods
  async getAllUsers(): Promise<User[]> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.select().from(users);
      return result;
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async updateUserAdminStatus(userId: string, isAdmin: boolean): Promise<User | undefined> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.update(users)
        .set({ isAdmin, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();
      return result[0] || undefined;
    } catch (error) {
      console.error('Error updating user admin status:', error);
      return undefined;
    }
  }

  async updateUserVerificationStatus(userId: string, isVerified: boolean): Promise<User | undefined> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.update(users)
        .set({ 
          isVerified, 
          verifiedAt: isVerified ? new Date() : null,
          updatedAt: new Date() 
        })
        .where(eq(users.id, userId))
        .returning();
      return result[0] || undefined;
    } catch (error) {
      console.error('Error updating user verification status:', error);
      return undefined;
    }
  }

  // Verification requests methods
  async createVerificationRequest(request: InsertVerificationRequest): Promise<VerificationRequest> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const newRequest = {
        id: randomUUID(),
        ...request,
        submittedAt: new Date(),
      };

      const result = await db.insert(verificationRequests).values(newRequest).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating verification request:', error);
      throw new Error(`فشل في إنشاء طلب التوثيق: ${error.message}`);
    }
  }

  async getVerificationRequests(userId?: string): Promise<VerificationRequest[]> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      let query = db.select().from(verificationRequests);
      
      if (userId) {
        query = query.where(eq(verificationRequests.userId, userId));
      }

      const result = await query.orderBy(sql`${verificationRequests.submittedAt} DESC`);
      return result;
    } catch (error) {
      console.error('Error getting verification requests:', error);
      return [];
    }
  }

  async getUserVerificationRequests(userId: string): Promise<VerificationRequest[]> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.select().from(verificationRequests)
        .where(eq(verificationRequests.userId, userId))
        .orderBy(sql`${verificationRequests.submittedAt} DESC`);
      return result;
    } catch (error) {
      console.error('Error getting user verification requests:', error);
      return [];
    }
  }

  async getVerificationRequest(requestId: string): Promise<VerificationRequest | undefined> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.select().from(verificationRequests)
        .where(eq(verificationRequests.id, requestId))
        .limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting verification request:', error);
      return undefined;
    }
  }

  async getAllVerificationRequests(status?: string): Promise<VerificationRequest[]> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      let query = db.select().from(verificationRequests);
      
      if (status) {
        query = query.where(eq(verificationRequests.status, status));
      }

      const result = await query.orderBy(sql`${verificationRequests.submittedAt} DESC`);
      return result;
    } catch (error) {
      console.error('Error getting all verification requests:', error);
      return [];
    }
  }

  async updateVerificationRequest(requestId: string, updates: Partial<Pick<VerificationRequest, 'status' | 'adminNote' | 'reviewedBy'>>): Promise<VerificationRequest | undefined> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.update(verificationRequests)
        .set({ 
          ...updates,
          reviewedAt: new Date()
        })
        .where(eq(verificationRequests.id, requestId))
        .returning();
      return result[0] || undefined;
    } catch (error) {
      console.error('Error updating verification request:', error);
      return undefined;
    }
  }

  // Stores and products methods
  async getStores(location?: string, category?: string): Promise<Store[]> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      let query = db.select().from(stores).where(eq(stores.isActive, true));
      
      if (location) {
        query = query.where(eq(stores.location, location));
      }
      
      if (category) {
        query = query.where(eq(stores.category, category));
      }
      
      const result = await query;
      return result;
    } catch (error) {
      console.error('Error getting stores:', error);
      return [];
    }
  }

  async getStore(storeId: string): Promise<Store | undefined> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.select().from(stores)
        .where(eq(stores.id, storeId))
        .limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting store:', error);
      return undefined;
    }
  }

  async createStore(store: InsertStore): Promise<Store> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.insert(stores).values(store).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating store:', error);
      throw error;
    }
  }

  async updateStore(storeId: string, updates: Partial<InsertStore>): Promise<Store | undefined> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.update(stores)
        .set(updates)
        .where(eq(stores.id, storeId))
        .returning();
      return result[0] || undefined;
    } catch (error) {
      console.error('Error updating store:', error);
      return undefined;
    }
  }

  async updateStoreStatus(storeId: string, status: string, reviewedBy: string, rejectionReason?: string): Promise<Store | undefined> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.update(stores)
        .set({ 
          status, 
          reviewedBy,
          reviewedAt: new Date(),
          rejectionReason: rejectionReason || null
        })
        .where(eq(stores.id, storeId))
        .returning();
      return result[0] || undefined;
    } catch (error) {
      console.error('Error updating store status:', error);
      return undefined;
    }
  }

  async getStoreProducts(storeId: string): Promise<Product[]> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.select().from(products)
        .where(eq(products.storeId, storeId));
      return result;
    } catch (error) {
      console.error('Error getting store products:', error);
      return [];
    }
  }

  async getAllStores(): Promise<Store[]> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.select().from(stores);
      return result;
    } catch (error) {
      console.error('Error getting all stores:', error);
      return [];
    }
  }

  async getUserStore(userId: string): Promise<Store | undefined> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.select().from(stores).where(eq(stores.userId, userId)).limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting user store:', error);
      return undefined;
    }
  }

  async deleteStore(storeId: string): Promise<boolean> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.delete(stores).where(eq(stores.id, storeId)).returning();
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting store:', error);
      return false;
    }
  }

  async getProducts(location?: string, category?: string): Promise<Product[]> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      let query = db.select().from(products).where(eq(products.isActive, true));
      
      if (location) {
        query = query.where(eq(products.location, location));
      }
      
      if (category) {
        query = query.where(eq(products.category, category));
      }
      
      const result = await query;
      return result;
    } catch (error) {
      console.error('Error getting products:', error);
      return [];
    }
  }

  async getProduct(productId: string): Promise<Product | undefined> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.select().from(products).where(eq(products.id, productId)).limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting product:', error);
      return undefined;
    }
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const newProduct = {
        id: randomUUID(),
        ...product,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const result = await db.insert(products).values(newProduct).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  async updateProduct(productId: string, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.update(products)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(products.id, productId))
        .returning();
      
      return result[0] || undefined;
    } catch (error) {
      console.error('Error updating product:', error);
      return undefined;
    }
  }

  async deleteProduct(productId: string): Promise<boolean> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.delete(products).where(eq(products.id, productId)).returning();
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting product:', error);
      return false;
    }
  }

  async getUserProducts(userId: string): Promise<Product[]> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.select().from(products).where(and(eq(products.userId, userId), eq(products.isActive, true)));
      return result;
    } catch (error) {
      console.error('Error getting user products:', error);
      return [];
    }
  }

  // Additional missing methods - stub implementations
  async createAffiliateLink(affiliateLink: InsertAffiliateLink): Promise<AffiliateLink> {
    throw new Error('Not implemented');
  }

  async getUserAffiliateLinks(userId: string): Promise<AffiliateLink[]> {
    return [];
  }

  async getAffiliateLink(uniqueCode: string): Promise<AffiliateLink | undefined> {
    return undefined;
  }

  async trackClick(uniqueCode: string): Promise<void> {
    // Stub implementation
  }

  async trackConversion(uniqueCode: string, buyerId: string, amount: number): Promise<void> {
    // Stub implementation
  }

  async getUserCommissions(userId: string): Promise<Commission[]> {
    return [];
  }

  async getTotalCommissions(userId: string): Promise<{ total: number; pending: number; paid: number }> {
    return { total: 0, pending: 0, paid: 0 };
  }

  async getCommissionsByStatus(status: string): Promise<Commission[]> {
    return [];
  }

  async getUserContacts(userId: string): Promise<Contact[]> {
    return [];
  }

  async addContact(contact: InsertContact): Promise<Contact> {
    throw new Error('Not implemented');
  }

  async searchUserByPhoneNumber(phoneNumber: string): Promise<User | undefined> {
    return this.getUserByPhoneNumber(phoneNumber);
  }

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    throw new Error('Not implemented');
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return [];
  }

  async getSellerOrders(sellerId: string): Promise<Order[]> {
    return [];
  }

  async getOrder(orderId: string): Promise<Order | undefined> {
    return undefined;
  }

  async updateOrderStatus(orderId: string, status: string, updatedBy: string): Promise<Order | undefined> {
    return undefined;
  }

  async cancelOrder(orderId: string, reason: string): Promise<Order | undefined> {
    return undefined;
  }

  async getAllOrders(): Promise<Order[]> {
    return [];
  }

  async clearCart(userId: string): Promise<void> {
    // Stub implementation
  }

  async getStickersByCategory(category?: string): Promise<Sticker[]> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      let query = db.select().from(stickers).where(eq(stickers.isActive, true));
      
      if (category) {
        query = query.where(eq(stickers.category, category));
      }
      
      const result = await query.orderBy(stickers.sortOrder);
      return result;
    } catch (error) {
      console.error('Error getting stickers by category:', error);
      return [];
    }
  }

  async initializeDefaultStickers(): Promise<void> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }

      console.log('Initializing default stickers in database...');
      
      // Check if stickers already exist
      const existingStickers = await db.select().from(stickers).limit(1);
      if (existingStickers.length > 0) {
        console.log('Stickers already initialized, skipping...');
        return;
      }

      const stickerCategories = [
        // Emotions and Faces (وجوه وتعابير)
        { category: 'emotions', stickers: [
          { name: '😀', imageUrl: '😀', nameAr: 'وجه مبتسم' },
          { name: '😃', imageUrl: '😃', nameAr: 'وجه مبتسم بعينين مفتوحتين' },
          { name: '😄', imageUrl: '😄', nameAr: 'وجه مبتسم بفم مفتوح' },
          { name: '😁', imageUrl: '😁', nameAr: 'وجه مبتسم بعينين ضاحكتين' },
          { name: '😆', imageUrl: '😆', nameAr: 'وجه ضاحك' },
          { name: '😅', imageUrl: '😅', nameAr: 'وجه مبتسم بعرق' },
          { name: '🤣', imageUrl: '🤣', nameAr: 'وجه يدحرج من الضحك' },
          { name: '😂', imageUrl: '😂', nameAr: 'وجه بدموع الفرح' },
          { name: '😊', imageUrl: '😊', nameAr: 'وجه مبتسم بعينين مبتسمتين' },
          { name: '😇', imageUrl: '😇', nameAr: 'وجه مبتسم بهالة' },
          { name: '🥰', imageUrl: '🥰', nameAr: 'وجه مبتسم بقلوب' },
          { name: '😍', imageUrl: '😍', nameAr: 'وجه بعينين قلب' },
          { name: '🤩', imageUrl: '🤩', nameAr: 'وجه مذهول بنجوم' },
          { name: '😘', imageUrl: '😘', nameAr: 'وجه يرسل قبلة' },
          { name: '😗', imageUrl: '😗', nameAr: 'وجه يقبل' },
          { name: '☺️', imageUrl: '☺️', nameAr: 'وجه مبتسم' },
          { name: '😚', imageUrl: '😚', nameAr: 'وجه يقبل بعينين مغلقتين' },
          { name: '😙', imageUrl: '😙', nameAr: 'وجه يقبل بعينين مبتسمتين' },
          { name: '🥲', imageUrl: '🥲', nameAr: 'وجه مبتسم بدمعة' },
          { name: '😋', imageUrl: '😋', nameAr: 'وجه يتذوق طعاماً لذيذاً' }
        ]},
        
        // Hearts and Love (قلوب وحب)
        { category: 'hearts', stickers: [
          { name: '❤️', imageUrl: '❤️', nameAr: 'قلب أحمر' },
          { name: '🧡', imageUrl: '🧡', nameAr: 'قلب برتقالي' },
          { name: '💛', imageUrl: '💛', nameAr: 'قلب أصفر' },
          { name: '💚', imageUrl: '💚', nameAr: 'قلب أخضر' },
          { name: '💙', imageUrl: '💙', nameAr: 'قلب أزرق' },
          { name: '💜', imageUrl: '💜', nameAr: 'قلب بنفسجي' },
          { name: '🖤', imageUrl: '🖤', nameAr: 'قلب أسود' },
          { name: '🤍', imageUrl: '🤍', nameAr: 'قلب أبيض' },
          { name: '🤎', imageUrl: '🤎', nameAr: 'قلب بني' },
          { name: '💔', imageUrl: '💔', nameAr: 'قلب مكسور' },
          { name: '❣️', imageUrl: '❣️', nameAr: 'علامة تعجب قلب' },
          { name: '💕', imageUrl: '💕', nameAr: 'قلبان وردي' },
          { name: '💞', imageUrl: '💞', nameAr: 'قلوب دوارة' },
          { name: '💓', imageUrl: '💓', nameAr: 'قلب نابض' },
          { name: '💗', imageUrl: '💗', nameAr: 'قلب نامي' },
          { name: '💖', imageUrl: '💖', nameAr: 'قلب لامع' },
          { name: '💘', imageUrl: '💘', nameAr: 'قلب بسهم' },
          { name: '💝', imageUrl: '💝', nameAr: 'قلب بشريطة' }
        ]},
        
        // Animals (حيوانات)
        { category: 'animals', stickers: [
          { name: '🐶', imageUrl: '🐶', nameAr: 'وجه كلب' },
          { name: '🐱', imageUrl: '🐱', nameAr: 'وجه قط' },
          { name: '🐭', imageUrl: '🐭', nameAr: 'وجه فأر' },
          { name: '🐹', imageUrl: '🐹', nameAr: 'وجه هامستر' },
          { name: '🐰', imageUrl: '🐰', nameAr: 'وجه أرنب' },
          { name: '🦊', imageUrl: '🦊', nameAr: 'وجه ثعلب' },
          { name: '🐻', imageUrl: '🐻', nameAr: 'وجه دب' },
          { name: '🐼', imageUrl: '🐼', nameAr: 'وجه باندا' },
          { name: '🐨', imageUrl: '🐨', nameAr: 'وجه كوالا' },
          { name: '🐯', imageUrl: '🐯', nameAr: 'وجه نمر' },
          { name: '🦁', imageUrl: '🦁', nameAr: 'وجه أسد' },
          { name: '🐮', imageUrl: '🐮', nameAr: 'وجه بقرة' },
          { name: '🐷', imageUrl: '🐷', nameAr: 'وجه خنزير' },
          { name: '🐸', imageUrl: '🐸', nameAr: 'وجه ضفدع' }
        ]},

        // Food and Drinks (طعام ومشروبات)
        { category: 'food', stickers: [
          { name: '🍎', imageUrl: '🍎', nameAr: 'تفاحة حمراء' },
          { name: '🍊', imageUrl: '🍊', nameAr: 'برتقالة' },
          { name: '🍌', imageUrl: '🍌', nameAr: 'موزة' },
          { name: '🍇', imageUrl: '🍇', nameAr: 'عنب' },
          { name: '🍓', imageUrl: '🍓', nameAر: 'فراولة' },
          { name: '🥝', imageUrl: '🥝', nameAr: 'كيوي' },
          { name: '🍅', imageUrl: '🍅', nameAr: 'طماطم' },
          { name: '🥑', imageUrl: '🥑', nameAr: 'أفوكادو' },
          { name: '🍞', imageUrl: '🍞', nameAr: 'خبز' },
          { name: '🥖', imageUrl: '🥖', nameAr: 'باغيت' },
          { name: '🧀', imageUrl: '🧀', nameAr: 'جبنة' },
          { name: '🥛', imageUrl: '🥛', nameAr: 'كوب حليب' },
          { name: '☕', imageUrl: '☕', nameAr: 'قهوة ساخنة' },
          { name: '🍵', imageUrl: '🍵', nameAر: 'شاي' },
          { name: '🧃', imageUrl: '🧃', nameAr: 'صندوق عصير' }
        ]},

        // Arab Countries (دول عربية)
        { category: 'flags', stickers: [
          { name: '🇸🇦', imageUrl: '🇸🇦', nameAr: 'علم السعودية' },
          { name: '🇦🇪', imageUrl: '🇦🇪', nameAr: 'علم الإمارات' },
          { name: '🇪🇬', imageUrl: '🇪🇬', nameAr: 'علم مصر' },
          { name: '🇯🇴', imageUrl: '🇯🇴', nameAr: 'علم الأردن' },
          { name: '🇱🇧', imageUrl: '🇱🇧', nameAr: 'علم لبنان' },
          { name: '🇸🇾', imageUrl: '🇸🇾', nameAr: 'علم سوريا' },
          { name: '🇮🇶', imageUrl: '🇮🇶', nameAr: 'علم العراق' },
          { name: '🇰🇼', imageUrl: '🇰🇼', nameAr: 'علم الكويت' },
          { name: '🇧🇭', imageUrl: '🇧🇭', nameAr: 'علم البحرين' },
          { name: '🇶🇦', imageUrl: '🇶🇦', nameAr: 'علم قطر' },
          { name: '🇴🇲', imageUrl: '🇴🇲', nameAr: 'علم عمان' },
          { name: '🇾🇪', imageUrl: '🇾🇪', nameAr: 'علم اليمن' },
          { name: '🇵🇸', imageUrl: '🇵🇸', nameAr: 'علم فلسطين' },
          { name: '🇲🇦', imageUrl: '🇲🇦', nameAr: 'علم المغرب' },
          { name: '🇩🇿', imageUrl: '🇩🇿', nameAr: 'علم الجزائر' }
        ]}
      ];

      // Add all stickers to database
      let sortOrder = 0;
      for (const categoryData of stickerCategories) {
        for (const sticker of categoryData.stickers) {
          await db.insert(stickers)
            .values({
              id: randomUUID(),
              name: sticker.name,
              imageUrl: sticker.imageUrl,
              category: categoryData.category,
              isActive: true,
              sortOrder: sortOrder++,
              createdAt: new Date()
            })
            .onConflictDoNothing();
        }
      }

      console.log(`📦 تم تحميل ${sortOrder} ملصق مجاني في ${stickerCategories.length} فئات في قاعدة البيانات`);
    } catch (error) {
      console.error('Error initializing default stickers:', error);
      // Don't throw - this is not critical
    }
  }

  // Admin dashboard stats for DatabaseStorage
  async getAdminDashboardStats(): Promise<any> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      // Get verification requests count
      const pendingRequests = await db.select({ count: sql`count(*)` })
        .from(verificationRequests)
        .where(eq(verificationRequests.status, 'pending'));
      
      const totalRequests = await db.select({ count: sql`count(*)` })
        .from(verificationRequests);
      
      // Get users count
      const totalUsers = await db.select({ count: sql`count(*)` })
        .from(users);
      
      // Get stores count  
      const totalStores = await db.select({ count: sql`count(*)` })
        .from(stores);
      
      return {
        pendingVerificationRequests: Number(pendingRequests[0]?.count || 0),
        totalVerificationRequests: Number(totalRequests[0]?.count || 0),
        totalUsers: Number(totalUsers[0]?.count || 0),
        totalStores: Number(totalStores[0]?.count || 0),
        todayRequests: 0, 
        totalRevenue: 0
      };
    } catch (error) {
      console.error('Error getting admin dashboard stats:', error);
      return {
        pendingVerificationRequests: 0,
        totalVerificationRequests: 0,
        totalUsers: 0,
        totalStores: 0,
        todayRequests: 0,
        totalRevenue: 0
      };
    }
  }

  // Call management methods for DatabaseStorage
  async createCall(callData: any): Promise<any> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }

      const newCall = {
        id: randomUUID(),
        ...callData,
        startedAt: new Date(),
        duration: 0
      };

      const result = await db.insert(calls).values(newCall).returning();
      console.log('📞 تم إنشاء مكالمة جديدة في قاعدة البيانات:', result[0].id);
      return result[0];
    } catch (error) {
      console.error('خطأ في إنشاء المكالمة:', error);
      throw error;
    }
  }

  async getCallById(callId: string): Promise<any> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }

      const result = await db.select().from(calls).where(eq(calls.id, callId)).limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('خطأ في جلب المكالمة:', error);
      return undefined;
    }
  }

  async updateCallStatus(callId: string, status: string): Promise<any> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }

      const updateData: any = { status };
      if (status === 'accepted') {
        updateData.acceptedAt = new Date();
      }

      const result = await db.update(calls)
        .set(updateData)
        .where(eq(calls.id, callId))
        .returning();

      console.log('📞 تم تحديث حالة المكالمة:', callId, 'إلى:', status);
      return result[0] || undefined;
    } catch (error) {
      console.error('خطأ في تحديث حالة المكالمة:', error);
      throw error;
    }
  }

  async endCall(callId: string, duration: number = 0): Promise<any> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }

      const result = await db.update(calls)
        .set({
          status: 'ended',
          endedAt: new Date(),
          duration
        })
        .where(eq(calls.id, callId))
        .returning();

      console.log('📞 تم إنهاء المكالمة:', callId, 'مدة:', duration, 'ثانية');
      return result[0] || undefined;
    } catch (error) {
      console.error('خطأ في إنهاء المكالمة:', error);
      throw error;
    }
  }

  async getActiveCallsForUser(userId: string): Promise<any[]> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }

      // Get calls with caller and receiver info using separate queries
      const callResults = await db.select()
        .from(calls)
        .where(
          and(
            sql`(${calls.callerId} = ${userId} OR ${calls.receiverId} = ${userId})`,
            sql`${calls.status} IN ('ringing', 'accepted')`
          )
        );

      // Get caller and receiver info for each call
      const result = await Promise.all(callResults.map(async (call) => {
        const caller = await db.select().from(users).where(eq(users.id, call.callerId)).limit(1);
        const receiver = await db.select().from(users).where(eq(users.id, call.receiverId)).limit(1);
        
        return {
          ...call,
          caller: caller[0] || null,
          receiver: receiver[0] || null,
          otherUser: call.callerId === userId ? receiver[0] : caller[0]
        };
      }));
      return result;
    } catch (error) {
      console.error('خطأ في جلب المكالمات النشطة:', error);
      return [];
    }
  }

  async getCallHistoryForUser(userId: string): Promise<any[]> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }

      const result = await db.select()
        .from(calls)
        .where(sql`${calls.callerId} = ${userId} OR ${calls.receiverId} = ${userId}`)
        .orderBy(sql`${calls.startedAt} DESC`);

      return result;
    } catch (error) {
      console.error('خطأ في جلب تاريخ المكالمات:', error);
      return [];
    }
  }

  // Neighborhood Groups - مجموعات الحي
  async getNeighborhoodGroups(location?: string): Promise<NeighborhoodGroup[]> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      let query = db.select().from(neighborhoodGroups).where(eq(neighborhoodGroups.isActive, true));
      
      if (location) {
        query = query.where(eq(neighborhoodGroups.location, location));
      }
      
      return await query;
    } catch (error) {
      console.error('خطأ في جلب مجموعات الحي:', error);
      return [];
    }
  }

  async getNeighborhoodGroup(groupId: string): Promise<NeighborhoodGroup | undefined> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.select().from(neighborhoodGroups).where(eq(neighborhoodGroups.id, groupId)).limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('خطأ في جلب مجموعة الحي:', error);
      return undefined;
    }
  }

  async createNeighborhoodGroup(group: InsertNeighborhoodGroup): Promise<NeighborhoodGroup> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.insert(neighborhoodGroups).values({
        ...group,
        id: randomUUID(),
        members: [group.createdBy],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      
      return result[0];
    } catch (error) {
      console.error('خطأ في إنشاء مجموعة الحي:', error);
      throw error;
    }
  }

  async joinNeighborhoodGroup(groupId: string, userId: string): Promise<void> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const group = await this.getNeighborhoodGroup(groupId);
      if (group && !group.members.includes(userId)) {
        const updatedMembers = [...group.members, userId];
        await db.update(neighborhoodGroups)
          .set({ members: updatedMembers, updatedAt: new Date() })
          .where(eq(neighborhoodGroups.id, groupId));
      }
    } catch (error) {
      console.error('خطأ في الانضمام لمجموعة الحي:', error);
      throw error;
    }
  }

  async leaveNeighborhoodGroup(groupId: string, userId: string): Promise<void> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const group = await this.getNeighborhoodGroup(groupId);
      if (group) {
        const updatedMembers = group.members.filter(id => id !== userId);
        await db.update(neighborhoodGroups)
          .set({ members: updatedMembers, updatedAt: new Date() })
          .where(eq(neighborhoodGroups.id, groupId));
      }
    } catch (error) {
      console.error('خطأ في ترك مجموعة الحي:', error);
      throw error;
    }
  }

  async getUserNeighborhoodGroups(userId: string): Promise<NeighborhoodGroup[]> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.select()
        .from(neighborhoodGroups)
        .where(sql`${neighborhoodGroups.members} ? ${userId}`);
      
      return result;
    } catch (error) {
      console.error('خطأ في جلب مجموعات المستخدم:', error);
      return [];
    }
  }

  // Help Requests - طلبات المساعدة
  async getHelpRequests(groupId?: string, status?: string): Promise<HelpRequest[]> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      let query = db.select().from(helpRequests);
      
      if (groupId) {
        query = query.where(eq(helpRequests.groupId, groupId));
      }
      
      if (status) {
        query = query.where(eq(helpRequests.status, status));
      }
      
      return await query.orderBy(sql`${helpRequests.createdAt} DESC`);
    } catch (error) {
      console.error('خطأ في جلب طلبات المساعدة:', error);
      return [];
    }
  }

  async getHelpRequest(requestId: string): Promise<HelpRequest | undefined> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.select().from(helpRequests).where(eq(helpRequests.id, requestId)).limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('خطأ في جلب طلب المساعدة:', error);
      return undefined;
    }
  }

  async createHelpRequest(request: InsertHelpRequest): Promise<HelpRequest> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.insert(helpRequests).values({
        ...request,
        id: randomUUID(),
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      
      return result[0];
    } catch (error) {
      console.error('خطأ في إنشاء طلب المساعدة:', error);
      throw error;
    }
  }

  async acceptHelpRequest(requestId: string, helperId: string): Promise<HelpRequest | undefined> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.update(helpRequests)
        .set({
          status: 'in_progress',
          helperId,
          acceptedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(helpRequests.id, requestId))
        .returning();
      
      return result[0] || undefined;
    } catch (error) {
      console.error('خطأ في قبول طلب المساعدة:', error);
      throw error;
    }
  }

  async completeHelpRequest(requestId: string, rating?: number, feedback?: string): Promise<HelpRequest | undefined> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.update(helpRequests)
        .set({
          status: 'completed',
          rating,
          feedback,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(helpRequests.id, requestId))
        .returning();
      
      return result[0] || undefined;
    } catch (error) {
      console.error('خطأ في إكمال طلب المساعدة:', error);
      throw error;
    }
  }

  async cancelHelpRequest(requestId: string): Promise<HelpRequest | undefined> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.update(helpRequests)
        .set({
          status: 'cancelled',
          updatedAt: new Date(),
        })
        .where(eq(helpRequests.id, requestId))
        .returning();
      
      return result[0] || undefined;
    } catch (error) {
      console.error('خطأ في إلغاء طلب المساعدة:', error);
      throw error;
    }
  }

  async getUserHelpRequests(userId: string): Promise<HelpRequest[]> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      return await db.select()
        .from(helpRequests)
        .where(eq(helpRequests.userId, userId))
        .orderBy(sql`${helpRequests.createdAt} DESC`);
    } catch (error) {
      console.error('خطأ في جلب طلبات المساعدة للمستخدم:', error);
      return [];
    }
  }

  async getUserHelperRequests(helperId: string): Promise<HelpRequest[]> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      return await db.select()
        .from(helpRequests)
        .where(eq(helpRequests.helperId, helperId))
        .orderBy(sql`${helpRequests.createdAt} DESC`);
    } catch (error) {
      console.error('خطأ في جلب طلبات المساعدة للمساعد:', error);
      return [];
    }
  }

  // Points System - نظام النقاط
  async getUserPoints(userId: string): Promise<number> {
    try {
      const user = await this.getUser(userId);
      return user?.points || 0;
    } catch (error) {
      console.error('خطأ في جلب نقاط المستخدم:', error);
      return 0;
    }
  }

  async addPoints(userId: string, points: number, reason: string, relatedId?: string, relatedType?: string): Promise<void> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      // Update user points
      const user = await this.getUser(userId);
      if (user) {
        await db.update(users)
          .set({ points: (user.points || 0) + points, updatedAt: new Date() })
          .where(eq(users.id, userId));
      }
      
      // Add transaction record
      await db.insert(pointTransactions).values({
        id: randomUUID(),
        userId,
        points,
        type: 'earned',
        reason,
        relatedId,
        relatedType,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('خطأ في إضافة النقاط:', error);
      throw error;
    }
  }

  async deductPoints(userId: string, points: number, reason: string, relatedId?: string, relatedType?: string): Promise<void> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      // Update user points
      const user = await this.getUser(userId);
      if (user) {
        const newPoints = Math.max(0, (user.points || 0) - points);
        await db.update(users)
          .set({ points: newPoints, updatedAt: new Date() })
          .where(eq(users.id, userId));
      }
      
      // Add transaction record
      await db.insert(pointTransactions).values({
        id: randomUUID(),
        userId,
        points: -points,
        type: 'spent',
        reason,
        relatedId,
        relatedType,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('خطأ في خصم النقاط:', error);
      throw error;
    }
  }

  async getPointTransactions(userId: string): Promise<PointTransaction[]> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      return await db.select()
        .from(pointTransactions)
        .where(eq(pointTransactions.userId, userId))
        .orderBy(sql`${pointTransactions.createdAt} DESC`);
    } catch (error) {
      console.error('خطأ في جلب معاملات النقاط:', error);
      return [];
    }
  }

  async updateUserStreak(userId: string): Promise<void> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const user = await this.getUser(userId);
      if (user) {
        const today = new Date();
        const lastStreakDate = user.lastStreakDate;
        
        let newStreak = user.streak || 0;
        
        if (!lastStreakDate || this.isNextDay(lastStreakDate, today)) {
          newStreak += 1;
        } else if (!this.isSameDay(lastStreakDate, today)) {
          newStreak = 1;
        }
        
        await db.update(users)
          .set({ 
            streak: newStreak,
            lastStreakDate: today,
            updatedAt: new Date() 
          })
          .where(eq(users.id, userId));
      }
    } catch (error) {
      console.error('خطأ في تحديث التسلسل:', error);
      throw error;
    }
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }

  private isNextDay(date1: Date, date2: Date): boolean {
    const nextDay = new Date(date1);
    nextDay.setDate(date1.getDate() + 1);
    return this.isSameDay(nextDay, date2);
  }

  async getTopUsers(limit = 10): Promise<User[]> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      return await db.select()
        .from(users)
        .orderBy(sql`${users.points} DESC`)
        .limit(limit);
    } catch (error) {
      console.error('خطأ في جلب أفضل المستخدمين:', error);
      return [];
    }
  }

  // Daily Missions Implementation
  async getDailyMissions(category?: string): Promise<DailyMission[]> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      let query = db.select().from(dailyMissions).where(eq(dailyMissions.isActive, true));
      
      if (category) {
        query = query.where(eq(dailyMissions.category, category));
      }
      
      return await query;
    } catch (error) {
      console.error('Error getting daily missions:', error);
      return [];
    }
  }

  async getUserDailyMissions(userId: string, date: string): Promise<UserMission[]> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      return await db.select()
        .from(userMissions)
        .innerJoin(dailyMissions, eq(userMissions.missionId, dailyMissions.id))
        .where(and(
          eq(userMissions.userId, userId),
          eq(userMissions.date, date)
        ));
    } catch (error) {
      console.error('Error getting user daily missions:', error);
      return [];
    }
  }

  async updateMissionProgress(userId: string, missionId: string, increment = 1): Promise<UserMission | undefined> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const today = new Date().toISOString().split('T')[0];
      
      // Get or create user mission
      let userMission = await db.select()
        .from(userMissions)
        .where(and(
          eq(userMissions.userId, userId),
          eq(userMissions.missionId, missionId),
          eq(userMissions.date, today)
        ))
        .limit(1);
      
      if (userMission.length === 0) {
        // Create new user mission
        const newMission = {
          id: randomUUID(),
          userId,
          missionId,
          progress: increment,
          isCompleted: false,
          date: today,
          createdAt: new Date()
        };
        
        await db.insert(userMissions).values(newMission);
        return newMission as UserMission;
      } else {
        // Update existing mission
        const mission = userMission[0];
        const newProgress = mission.progress + increment;
        
        // Check if mission is completed
        const dailyMission = await db.select()
          .from(dailyMissions)
          .where(eq(dailyMissions.id, missionId))
          .limit(1);
        
        const isCompleted = dailyMission.length > 0 && newProgress >= dailyMission[0].targetCount;
        
        const updatedMission = {
          ...mission,
          progress: newProgress,
          isCompleted,
          completedAt: isCompleted ? new Date() : mission.completedAt
        };
        
        await db.update(userMissions)
          .set(updatedMission)
          .where(eq(userMissions.id, mission.id));
        
        // Award points if completed
        if (isCompleted && !mission.isCompleted && dailyMission.length > 0) {
          await this.addPoints(userId, dailyMission[0].points, `مهمة: ${dailyMission[0].title}`, mission.id, 'mission');
        }
        
        return updatedMission as UserMission;
      }
    } catch (error) {
      console.error('Error updating mission progress:', error);
      return undefined;
    }
  }

  async completeMission(userId: string, missionId: string): Promise<UserMission | undefined> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const today = new Date().toISOString().split('T')[0];
      
      const updated = await db.update(userMissions)
        .set({
          isCompleted: true,
          completedAt: new Date()
        })
        .where(and(
          eq(userMissions.userId, userId),
          eq(userMissions.missionId, missionId),
          eq(userMissions.date, today)
        ))
        .returning();
      
      return updated[0] as UserMission;
    } catch (error) {
      console.error('Error completing mission:', error);
      return undefined;
    }
  }

  async initializeDailyMissions(): Promise<void> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const existingMissions = await db.select().from(dailyMissions).limit(1);
      if (existingMissions.length > 0) {
        return; // Already initialized
      }
      
      const defaultMissions = [
        {
          id: randomUUID(),
          title: "إرسال رسالة ترحيب",
          description: "أرسل رسالة لشخص جديد في المجتمع",
          category: "social",
          points: 10,
          targetCount: 1,
          isActive: true,
          createdAt: new Date()
        },
        {
          id: randomUUID(),
          title: "تقديم المساعدة",
          description: "ساعد شخصاً في طلب مساعدة",
          category: "help",
          points: 20,
          targetCount: 1,
          isActive: true,
          createdAt: new Date()
        },
        {
          id: randomUUID(),
          title: "نشر منتج",
          description: "انشر منتجاً جديداً في متجرك",
          category: "business",
          points: 15,
          targetCount: 1,
          isActive: true,
          createdAt: new Date()
        },
        {
          id: randomUUID(),
          title: "تفاعل اجتماعي",
          description: "تفاعل مع 3 قصص من الأشخاص",
          category: "social",
          points: 5,
          targetCount: 3,
          isActive: true,
          createdAt: new Date()
        }
      ];
      
      await db.insert(dailyMissions).values(defaultMissions);
      console.log('✅ Default daily missions initialized');
    } catch (error) {
      console.error('Error initializing daily missions:', error);
    }
  }

  async resetDailyMissions(userId: string, date: string): Promise<void> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      await db.delete(userMissions)
        .where(and(
          eq(userMissions.userId, userId),
          eq(userMissions.date, date)
        ));
    } catch (error) {
      console.error('Error resetting daily missions:', error);
    }
  }

  // Customer Tags Implementation
  async getCustomerTags(userId: string): Promise<CustomerTag[]> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      return await db.select()
        .from(customerTags)
        .where(eq(customerTags.userId, userId));
    } catch (error) {
      console.error('Error getting customer tags:', error);
      return [];
    }
  }

  async getContactTag(userId: string, contactId: string): Promise<CustomerTag | undefined> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.select()
        .from(customerTags)
        .where(and(
          eq(customerTags.userId, userId),
          eq(customerTags.contactId, contactId)
        ))
        .limit(1);
      
      return result[0];
    } catch (error) {
      console.error('Error getting contact tag:', error);
      return undefined;
    }
  }

  async setCustomerTag(tag: InsertCustomerTag): Promise<CustomerTag> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const newTag = {
        id: randomUUID(),
        ...tag,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const inserted = await db.insert(customerTags).values(newTag).returning();
      return inserted[0] as CustomerTag;
    } catch (error) {
      console.error('Error setting customer tag:', error);
      throw error;
    }
  }

  async updateCustomerTag(tagId: string, updates: Partial<InsertCustomerTag>): Promise<CustomerTag | undefined> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const updated = await db.update(customerTags)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(customerTags.id, tagId))
        .returning();
      
      return updated[0] as CustomerTag;
    } catch (error) {
      console.error('Error updating customer tag:', error);
      return undefined;
    }
  }

  async deleteCustomerTag(tagId: string): Promise<void> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      await db.delete(customerTags).where(eq(customerTags.id, tagId));
    } catch (error) {
      console.error('Error deleting customer tag:', error);
    }
  }

  // Quick Replies Implementation
  async getQuickReplies(userId: string, category?: string): Promise<QuickReply[]> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      let query = db.select().from(quickReplies).where(eq(quickReplies.userId, userId));
      
      if (category) {
        query = query.where(eq(quickReplies.category, category));
      }
      
      return await query.orderBy(quickReplies.usageCount);
    } catch (error) {
      console.error('Error getting quick replies:', error);
      return [];
    }
  }

  async createQuickReply(reply: InsertQuickReply): Promise<QuickReply> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const newReply = {
        id: randomUUID(),
        ...reply,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const inserted = await db.insert(quickReplies).values(newReply).returning();
      return inserted[0] as QuickReply;
    } catch (error) {
      console.error('Error creating quick reply:', error);
      throw error;
    }
  }

  async updateQuickReply(replyId: string, updates: Partial<InsertQuickReply>): Promise<QuickReply | undefined> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const updated = await db.update(quickReplies)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(quickReplies.id, replyId))
        .returning();
      
      return updated[0] as QuickReply;
    } catch (error) {
      console.error('Error updating quick reply:', error);
      return undefined;
    }
  }

  async incrementQuickReplyUsage(replyId: string): Promise<void> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      await db.update(quickReplies)
        .set({ 
          usageCount: sql`${quickReplies.usageCount} + 1`,
          updatedAt: new Date()
        })
        .where(eq(quickReplies.id, replyId));
    } catch (error) {
      console.error('Error incrementing quick reply usage:', error);
    }
  }

  async deleteQuickReply(replyId: string): Promise<void> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      await db.delete(quickReplies).where(eq(quickReplies.id, replyId));
    } catch (error) {
      console.error('Error deleting quick reply:', error);
    }
  }

  // Reminders Implementation
  async getReminders(userId: string): Promise<Reminder[]> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      return await db.select()
        .from(reminders)
        .where(and(
          eq(reminders.userId, userId),
          eq(reminders.isCompleted, false)
        ))
        .orderBy(reminders.reminderTime);
    } catch (error) {
      console.error('Error getting reminders:', error);
      return [];
    }
  }

  async createReminder(reminder: InsertReminder): Promise<Reminder> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const newReminder = {
        id: randomUUID(),
        ...reminder,
        isCompleted: false,
        createdAt: new Date()
      };
      
      const inserted = await db.insert(reminders).values(newReminder).returning();
      return inserted[0] as Reminder;
    } catch (error) {
      console.error('Error creating reminder:', error);
      throw error;
    }
  }

  async markReminderComplete(reminderId: string): Promise<void> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      await db.update(reminders)
        .set({ 
          isCompleted: true,
          completedAt: new Date()
        })
        .where(eq(reminders.id, reminderId));
    } catch (error) {
      console.error('Error marking reminder complete:', error);
    }
  }

  async getDueReminders(): Promise<Reminder[]> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      return await db.select()
        .from(reminders)
        .where(and(
          eq(reminders.isCompleted, false),
          sql`${reminders.reminderTime} <= NOW()`
        ))
        .orderBy(reminders.reminderTime);
    } catch (error) {
      console.error('Error getting due reminders:', error);
      return [];
    }
  }

  async deleteReminder(reminderId: string): Promise<void> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      await db.delete(reminders).where(eq(reminders.id, reminderId));
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  }

  // Invoice Management Implementation - إدارة الفواتير
  async createInvoice(invoiceData: InsertInvoice, items: InsertInvoiceItem[]): Promise<Invoice> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      // Use transaction to ensure atomicity
      return await db.transaction(async (tx) => {
        // Generate unique invoice number
        const invoiceNumber = await this.generateInvoiceNumber(invoiceData.userId);
        
        // Calculate and validate items server-side (security: don't trust client totals)
        const validatedItems = items.map(item => {
          const quantity = Math.round(parseFloat(item.quantity.toString()) * 100) / 100; // Round to 2 decimals
          const unitPrice = Math.round(parseFloat(item.unitPrice.toString()) * 100) / 100;
          const totalPrice = Math.round(quantity * unitPrice * 100) / 100; // Recompute server-side
          
          return {
            ...item,
            quantity: quantity.toString(),
            unitPrice: unitPrice.toString(),
            totalPrice: totalPrice.toString()
          };
        });
        
        // Calculate totals using integer cents to avoid floating point errors
        const subtotalCents = validatedItems.reduce((sum, item) => {
          return sum + Math.round(parseFloat(item.totalPrice) * 100);
        }, 0);
        
        const taxRateCents = Math.round(parseFloat((invoiceData.taxRate || "0.00").toString()) * 100);
        const taxAmountCents = Math.round((subtotalCents * taxRateCents) / 10000);
        const discountAmountCents = Math.round(parseFloat((invoiceData.discountAmount || "0.00").toString()) * 100);
        const totalAmountCents = subtotalCents + taxAmountCents - discountAmountCents;
        
        const newInvoice = {
          id: randomUUID(),
          ...invoiceData,
          invoiceNumber,
          subtotal: (subtotalCents / 100).toFixed(2),
          taxAmount: (taxAmountCents / 100).toFixed(2),
          totalAmount: (totalAmountCents / 100).toFixed(2),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const insertedInvoice = await tx.insert(invoices).values(newInvoice).returning();
        const invoice = insertedInvoice[0] as Invoice;
        
        // Insert invoice items with validated data
        if (validatedItems.length > 0) {
          const itemsToInsert = validatedItems.map(item => ({
            id: randomUUID(),
            invoiceId: invoice.id,
            ...item,
            createdAt: new Date()
          }));
          
          await tx.insert(invoiceItems).values(itemsToInsert);
        }
        
        return invoice;
      });
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  async generateInvoiceNumber(userId: string): Promise<string> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      // Generate collision-safe invoice number using timestamp and random suffix
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
      const random = Math.floor(Math.random() * 999).toString().padStart(3, '0');
      
      return `INV-${year}${month}-${timestamp}${random}`;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      return `INV-${Date.now()}-${Math.floor(Math.random() * 999)}`;
    }
  }

  async getUserInvoices(userId: string, status?: string): Promise<Invoice[]> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      // Build query conditions properly using and()
      const conditions = [eq(invoices.userId, userId)];
      if (status) {
        conditions.push(eq(invoices.status, status));
      }
      
      return await db.select()
        .from(invoices)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .orderBy(sql`${invoices.createdAt} DESC`);
    } catch (error) {
      console.error('Error getting user invoices:', error);
      return [];
    }
  }

  async getInvoice(invoiceId: string, userId?: string): Promise<Invoice | undefined> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      // Build conditions with ownership check if userId provided
      const conditions = [eq(invoices.id, invoiceId)];
      if (userId) {
        conditions.push(eq(invoices.userId, userId));
      }
      
      const result = await db.select()
        .from(invoices)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .limit(1);
      
      return result[0] as Invoice;
    } catch (error) {
      console.error('Error getting invoice:', error);
      return undefined;
    }
  }

  async getInvoiceWithItems(invoiceId: string, userId?: string): Promise<{ invoice: Invoice; items: InvoiceItem[] } | undefined> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      // Get invoice with ownership check
      const invoice = await this.getInvoice(invoiceId, userId);
      if (!invoice) return undefined;
      
      const items = await db.select()
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, invoiceId));
      
      return { invoice, items: items as InvoiceItem[] };
    } catch (error) {
      console.error('Error getting invoice with items:', error);
      return undefined;
    }
  }

  async updateInvoiceStatus(invoiceId: string, status: string, userId: string, paidAt?: Date): Promise<Invoice | undefined> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const updateData: any = {
        status,
        updatedAt: new Date()
      };
      
      if (status === 'paid' && paidAt) {
        updateData.paidAt = paidAt;
      }
      
      // Update only if user owns the invoice (security: prevent IDOR)
      const updated = await db.update(invoices)
        .set(updateData)
        .where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId)))
        .returning();
      
      return updated[0] as Invoice;
    } catch (error) {
      console.error('Error updating invoice status:', error);
      return undefined;
    }
  }

  async updateInvoice(invoiceId: string, userId: string, updates: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      // Only allow safe fields to be updated (security: prevent tampering with totals/ownership)
      const safeUpdates = {
        customerName: updates.customerName,
        customerPhone: updates.customerPhone,
        customerEmail: updates.customerEmail,
        customerAddress: updates.customerAddress,
        dueDate: updates.dueDate,
        notes: updates.notes,
        terms: updates.terms,
        currency: updates.currency,
        updatedAt: new Date()
      };
      
      // Remove undefined fields
      Object.keys(safeUpdates).forEach(key => {
        if (safeUpdates[key] === undefined) delete safeUpdates[key];
      });
      
      // Update only if user owns the invoice (security: prevent IDOR)
      const updated = await db.update(invoices)
        .set(safeUpdates)
        .where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId)))
        .returning();
      
      return updated[0] as Invoice;
    } catch (error) {
      console.error('Error updating invoice:', error);
      return undefined;
    }
  }

  async deleteInvoice(invoiceId: string, userId: string): Promise<boolean> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      // Use transaction to ensure atomicity
      return await db.transaction(async (tx) => {
        // Check ownership first (security: prevent IDOR)
        const invoice = await tx.select()
          .from(invoices)
          .where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId)))
          .limit(1);
        
        if (invoice.length === 0) {
          return false; // Invoice not found or not owned by user
        }
        
        // Delete invoice items first
        await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
        
        // Delete invoice
        await tx.delete(invoices).where(eq(invoices.id, invoiceId));
        
        return true;
      });
    } catch (error) {
      console.error('Error deleting invoice:', error);
      return false;
    }
  }

  async getInvoiceStats(userId: string): Promise<{ total: number; paid: number; overdue: number; draft: number }> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const stats = await db.select({
        status: invoices.status,
        count: sql`count(*)`
      })
      .from(invoices)
      .where(eq(invoices.userId, userId))
      .groupBy(invoices.status);
      
      const result = { total: 0, paid: 0, overdue: 0, draft: 0 };
      
      stats.forEach(stat => {
        const count = parseInt(stat.count?.toString() || '0');
        result.total += count;
        if (stat.status === 'paid') result.paid += count;
        else if (stat.status === 'overdue') result.overdue += count;
        else if (stat.status === 'draft') result.draft += count;
      });
      
      return result;
    } catch (error) {
      console.error('Error getting invoice stats:', error);
      return { total: 0, paid: 0, overdue: 0, draft: 0 };
    }
  }
}

// Memory Storage Implementation - fallback when no database
export class MemStorage implements IStorage {
  private users = new Map<string, User>();
  private chats = new Map<string, Chat>();
  private messages = new Map<string, Message>();
  private stories = new Map<string, Story>();
  private sessions = new Map<string, Session>();
  private otpCodes = new Map<string, OtpCode>();
  private features = new Map<string, AppFeature>();
  private adminCredentials: AdminCredentials | undefined;
  private calls = new Map<string, Call>();
  private stickers: any[] = [];
  private stores = new Map<string, Store>();
  private products = new Map<string, Product>();
  private affiliateLinks = new Map<string, AffiliateLink>();
  private commissions = new Map<string, Commission>();
  private contacts = new Map<string, Contact>();
  private cartItems = new Map<string, CartItem>();
  private orders = new Map<string, Order>();
  private orderItems = new Map<string, OrderItem>();
  private verificationRequests = new Map<string, VerificationRequest>();
  private storyLikes = new Map<string, StoryLike>();
  private storyComments = new Map<string, StoryComment>();
  private signupTokens = new Map<string, { email: string; token: string; expiresAt: Date }>();

  constructor() {
    // Initialize only default features - NO MOCK DATA
    this.initializeDefaultFeatures();
    // Initialize free stickers collection
    this.initializeDefaultStickers();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.phoneNumber === phoneNumber);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: randomUUID(),
      ...user,
      isOnline: user.isOnline ?? false,
      isVerified: user.isVerified ?? false,
      verifiedAt: user.verifiedAt || null,
      isAdmin: user.isAdmin ?? false,
      lastSeen: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserOnlineStatus(id: string, isOnline: boolean): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.isOnline = isOnline;
      user.lastSeen = new Date();
      user.updatedAt = new Date();
      this.users.set(id, user);
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Authentication methods
  async createOtpCode(otp: InsertOtp): Promise<OtpCode> {
    const newOtp: OtpCode = {
      id: randomUUID(),
      ...otp,
      createdAt: new Date(),
    };
    this.otpCodes.set(newOtp.id, newOtp);
    return newOtp;
  }

  async verifyOtpCode(email: string, code: string): Promise<boolean> {
    const otpRecord = Array.from(this.otpCodes.values()).find(
      otp => otp.email === email && otp.code === code && !otp.isUsed
    );

    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      return false;
    }

    otpRecord.isUsed = true;
    this.otpCodes.set(otpRecord.id, otpRecord);
    return true;
  }

  async createSession(session: InsertSession): Promise<Session> {
    const newSession: Session = {
      id: randomUUID(),
      ...session,
      createdAt: new Date(),
    };
    this.sessions.set(newSession.token, newSession);
    return newSession;
  }

  async getSessionByToken(token: string): Promise<Session | undefined> {
    return this.sessions.get(token);
  }

  async deleteSession(token: string): Promise<void> {
    this.sessions.delete(token);
  }

  // Signup token methods for secure user creation
  async createSignupToken(email: string): Promise<string> {
    const token = randomUUID();
    const tokenData = {
      email: email.toLowerCase().trim(),
      token,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    };
    
    this.signupTokens.set(token, tokenData);
    
    // Auto cleanup expired tokens
    setTimeout(() => this.cleanupExpiredSignupTokens(), 5 * 60 * 1000);
    
    return token;
  }

  async validateAndConsumeSignupToken(token: string, email: string): Promise<boolean> {
    const tokenData = this.signupTokens.get(token);
    
    if (!tokenData) {
      return false;
    }
    
    if (tokenData.expiresAt < new Date()) {
      this.signupTokens.delete(token);
      return false;
    }
    
    if (tokenData.email !== email.toLowerCase().trim()) {
      return false;
    }
    
    // Consume the token (one-time use)
    this.signupTokens.delete(token);
    return true;
  }

  async cleanupExpiredSignupTokens(): Promise<void> {
    const now = new Date();
    for (const [token, tokenData] of this.signupTokens.entries()) {
      if (tokenData.expiresAt < now) {
        this.signupTokens.delete(token);
      }
    }
  }

  // Chat methods
  async getChat(id: string): Promise<Chat | undefined> {
    return this.chats.get(id);
  }

  async getUserChats(userId: string): Promise<Chat[]> {
    return Array.from(this.chats.values()).filter(chat => 
      chat.participants.includes(userId)
    );
  }

  async createChat(chat: InsertChat): Promise<Chat> {
    const newChat: Chat = {
      id: randomUUID(),
      ...chat,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.chats.set(newChat.id, newChat);
    return newChat;
  }

  async deleteChat(id: string): Promise<boolean> {
    return this.chats.delete(id);
  }

  // Message methods
  async getChatMessages(chatId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.chatId === chatId)
      .sort((a, b) => (a.timestamp?.getTime() ?? 0) - (b.timestamp?.getTime() ?? 0));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const newMessage: Message = {
      id: randomUUID(),
      ...message,
      timestamp: new Date(),
    };
    this.messages.set(newMessage.id, newMessage);
    return newMessage;
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    const message = this.messages.get(messageId);
    if (message) {
      message.isRead = true;
      this.messages.set(messageId, message);
    }
  }

  async markMessageAsDelivered(messageId: string): Promise<void> {
    const message = this.messages.get(messageId);
    if (message) {
      message.isDelivered = true;
      this.messages.set(messageId, message);
    }
  }

  async searchMessages(chatId: string, searchTerm: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => 
        message.chatId === chatId &&
        message.content?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }

  async updateMessage(messageId: string, content: string): Promise<Message | undefined> {
    const message = this.messages.get(messageId);
    if (!message) return undefined;

    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    this.messages.set(messageId, message);
    return message;
  }

  async deleteMessage(messageId: string): Promise<void> {
    const message = this.messages.get(messageId);
    if (message) {
      message.deletedAt = new Date();
      this.messages.set(messageId, message);
    }
  }

  // Story methods
  async getActiveStories(): Promise<(Story & { user: User })[]> {
    const now = new Date();
    return Array.from(this.stories.values())
      .filter(story => story.expiresAt > now)
      .map(story => ({
        ...story,
        user: this.users.get(story.userId)!,
      }))
      .filter(story => story.user);
  }

  async getUserStories(userId: string): Promise<Story[]> {
    return Array.from(this.stories.values())
      .filter(story => story.userId === userId)
      .sort((a, b) => (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0));
  }

  async createStory(story: InsertStory): Promise<Story> {
    const newStory: Story = {
      id: randomUUID(),
      ...story,
      timestamp: new Date(),
      viewCount: "0",
      viewers: [],
    };
    this.stories.set(newStory.id, newStory);
    return newStory;
  }

  async viewStory(storyId: string, viewerId: string): Promise<void> {
    const story = this.stories.get(storyId);
    if (story) {
      const viewers = story.viewers || [];
      if (!viewers.includes(viewerId)) {
        story.viewers = [...viewers, viewerId];
        story.viewCount = (parseInt(story.viewCount) + 1).toString();
        this.stories.set(storyId, story);
      }
    }
  }

  async getStory(storyId: string): Promise<Story | undefined> {
    return this.stories.get(storyId);
  }

  // Story interactions for MemStorage
  async likeStory(storyId: string, userId: string, reactionType: string): Promise<StoryLike> {
    const newLike: StoryLike = {
      id: randomUUID(),
      storyId,
      userId,
      reactionType,
      timestamp: new Date(),
    };
    
    this.storyLikes.set(newLike.id, newLike);
    return newLike;
  }

  async unlikeStory(storyId: string, userId: string): Promise<void> {
    for (const [id, like] of this.storyLikes.entries()) {
      if (like.storyId === storyId && like.userId === userId) {
        this.storyLikes.delete(id);
        break;
      }
    }
  }

  async getStoryLikes(storyId: string): Promise<(StoryLike & { user: User })[]> {
    return Array.from(this.storyLikes.values())
      .filter(like => like.storyId === storyId)
      .map(like => ({
        ...like,
        user: this.users.get(like.userId)!,
      }));
  }

  async getStoryLikeCount(storyId: string): Promise<number> {
    return Array.from(this.storyLikes.values())
      .filter(like => like.storyId === storyId)
      .length;
  }

  async hasUserLikedStory(storyId: string, userId: string): Promise<boolean> {
    return Array.from(this.storyLikes.values())
      .some(like => like.storyId === storyId && like.userId === userId);
  }

  async addStoryComment(storyId: string, userId: string, content: string): Promise<StoryComment> {
    const newComment: StoryComment = {
      id: randomUUID(),
      storyId,
      userId,
      content,
      timestamp: new Date(),
    };
    
    this.storyComments.set(newComment.id, newComment);
    return newComment;
  }

  async getStoryComments(storyId: string): Promise<(StoryComment & { user: User })[]> {
    return Array.from(this.storyComments.values())
      .filter(comment => comment.storyId === storyId)
      .map(comment => ({
        ...comment,
        user: this.users.get(comment.userId)!,
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async getStoryCommentCount(storyId: string): Promise<number> {
    return Array.from(this.storyComments.values())
      .filter(comment => comment.storyId === storyId)
      .length;
  }

  async updateStoryComment(commentId: string, content: string): Promise<StoryComment | undefined> {
    const comment = this.storyComments.get(commentId);
    if (comment) {
      comment.content = content;
      this.storyComments.set(commentId, comment);
      return comment;
    }
    return undefined;
  }

  async deleteStoryComment(commentId: string): Promise<boolean> {
    return this.storyComments.delete(commentId);
  }

  // Admin methods
  async getAdminCredentials(): Promise<AdminCredentials | undefined> {
    return this.adminCredentials;
  }

  async updateAdminCredentials(credentials: InsertAdminCredentials): Promise<AdminCredentials> {
    this.adminCredentials = {
      id: "admin_settings",
      email: credentials.email,
      password: credentials.password,
      updatedAt: new Date(),
      createdAt: new Date(),
    };
    return this.adminCredentials;
  }

  async getAllFeatures(): Promise<AppFeature[]> {
    return Array.from(this.features.values()).sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
  }

  async getFeature(featureId: string): Promise<AppFeature | undefined> {
    return this.features.get(featureId);
  }

  async updateFeature(featureId: string, updates: Partial<InsertAppFeature>): Promise<AppFeature | undefined> {
    const feature = this.features.get(featureId);
    if (!feature) return undefined;

    const updatedFeature = { ...feature, ...updates, updatedAt: new Date() };
    this.features.set(featureId, updatedFeature);
    return updatedFeature;
  }

  async initializeDefaultFeatures(): Promise<void> {
    const defaultFeatures: AppFeature[] = [
      { id: "messaging", name: "المراسلة", description: "إرسال واستقبال الرسائل الفورية", isEnabled: true, category: "messaging", priority: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: "stories", name: "الحالات", description: "مشاركة الحالات والقصص", isEnabled: true, category: "social", priority: 2, createdAt: new Date(), updatedAt: new Date() },
      { id: "marketplace", name: "السوق", description: "بيع وشراء المنتجات", isEnabled: true, category: "marketplace", priority: 3, createdAt: new Date(), updatedAt: new Date() },
      { id: "stores", name: "المتاجر", description: "إنشاء وإدارة المتاجر", isEnabled: true, category: "marketplace", priority: 4, createdAt: new Date(), updatedAt: new Date() },
      { id: "neighborhoods", name: "مجتمع الحي", description: "التواصل مع الجيران وطلب المساعدة", isEnabled: true, category: "social", priority: 5, createdAt: new Date(), updatedAt: new Date() },
      { id: "affiliate", name: "التسويق بالعمولة", description: "كسب المال من خلال التسويق", isEnabled: true, category: "marketplace", priority: 6, createdAt: new Date(), updatedAt: new Date() },
      { id: "verification", name: "التوثيق", description: "توثيق الحسابات والمتاجر", isEnabled: true, category: "admin", priority: 7, createdAt: new Date(), updatedAt: new Date() },
    ];

    defaultFeatures.forEach(feature => {
      if (!this.features.has(feature.id)) {
        this.features.set(feature.id, feature);
      }
    });
  }

  // Initialize comprehensive free stickers collection
  private initializeDefaultStickers() {
    const stickerCategories = [
      // Emotions and Faces (وجوه وتعابير)
      { category: 'emotions', stickers: [
        { name: '😀', imageUrl: '😀', nameAr: 'وجه مبتسم' },
        { name: '😃', imageUrl: '😃', nameAr: 'وجه مبتسم بعينين مفتوحتين' },
        { name: '😄', imageUrl: '😄', nameAr: 'وجه مبتسم بفم مفتوح' },
        { name: '😁', imageUrl: '😁', nameAr: 'وجه مبتسم بعينين ضاحكتين' },
        { name: '😆', imageUrl: '😆', nameAr: 'وجه ضاحك' },
        { name: '😅', imageUrl: '😅', nameAr: 'وجه مبتسم بعرق' },
        { name: '🤣', imageUrl: '🤣', nameAr: 'وجه يدحرج من الضحك' },
        { name: '😂', imageUrl: '😂', nameAr: 'وجه بدموع الفرح' },
        { name: '🙂', imageUrl: '🙂', nameAr: 'وجه مبتسم قليلاً' },
        { name: '🙃', imageUrl: '🙃', nameAr: 'وجه مقلوب' },
        { name: '😉', imageUrl: '😉', nameAr: 'وجه غامز' },
        { name: '😊', imageUrl: '😊', nameAr: 'وجه مبتسم بعينين مبتسمتين' },
        { name: '😇', imageUrl: '😇', nameAr: 'وجه مبتسم بهالة' },
        { name: '🥰', imageUrl: '🥰', nameAr: 'وجه مبتسم بقلوب' },
        { name: '😍', imageUrl: '😍', nameAr: 'وجه بعينين قلب' },
        { name: '🤩', imageUrl: '🤩', nameAr: 'وجه مذهول بنجوم' },
        { name: '😘', imageUrl: '😘', nameAr: 'وجه يرسل قبلة' },
        { name: '😗', imageUrl: '😗', nameAr: 'وجه يقبل' },
        { name: '☺️', imageUrl: '☺️', nameAr: 'وجه مبتسم' },
        { name: '😚', imageUrl: '😚', nameAr: 'وجه يقبل بعينين مغلقتين' },
        { name: '😙', imageUrl: '😙', nameAr: 'وجه يقبل بعينين مبتسمتين' },
        { name: '🥲', imageUrl: '🥲', nameAr: 'وجه مبتسم بدمعة' },
        { name: '😋', imageUrl: '😋', nameAr: 'وجه يتذوق طعاماً لذيذاً' },
        { name: '😛', imageUrl: '😛', nameAr: 'وجه مخرج لسانه' },
        { name: '😜', imageUrl: '😜', nameAr: 'وجه غامز مخرج لسانه' },
        { name: '🤪', imageUrl: '🤪', nameAr: 'وجه مجنون' },
        { name: '😝', imageUrl: '😝', nameAr: 'وجه مخرج لسانه بعينين مغلقتين' },
        { name: '🤑', imageUrl: '🤑', nameAr: 'وجه بفم دولار' },
        { name: '🤗', imageUrl: '🤗', nameAr: 'وجه معانق' },
        { name: '🤭', imageUrl: '🤭', nameAr: 'وجه بيد على الفم' },
        { name: '🤫', imageUrl: '🤫', nameAr: 'وجه يطلب الصمت' },
        { name: '🤔', imageUrl: '🤔', nameAr: 'وجه مفكر' },
        { name: '🤐', imageUrl: '🤐', nameAr: 'وجه بسحاب على الفم' },
        { name: '🤨', imageUrl: '🤨', nameAr: 'وجه بحاجب مرفوع' },
        { name: '😐', imageUrl: '😐', nameAr: 'وجه محايد' },
        { name: '😑', imageUrl: '😑', nameAr: 'وجه بدون تعبير' },
        { name: '😶', imageUrl: '😶', nameAr: 'وجه بدون فم' },
        { name: '😏', imageUrl: '😏', nameAr: 'وجه ماكر' },
        { name: '😒', imageUrl: '😒', nameAr: 'وجه غير مهتم' },
        { name: '🙄', imageUrl: '🙄', nameAr: 'وجه يدحرج عينيه' },
        { name: '😬', imageUrl: '😬', nameAr: 'وجه محرج' },
        { name: '🤥', imageUrl: '🤥', nameAr: 'وجه كاذب' },
        { name: '😔', imageUrl: '😔', nameAr: 'وجه حزين' },
        { name: '😕', imageUrl: '😕', nameAr: 'وجه مرتبك' },
        { name: '🙁', imageUrl: '🙁', nameAr: 'وجه عابس قليلاً' },
        { name: '☹️', imageUrl: '☹️', nameAr: 'وجه عابس' },
        { name: '😣', imageUrl: '😣', nameAr: 'وجه مثابر' },
        { name: '😖', imageUrl: '😖', nameAr: 'وجه مرتبك' },
        { name: '😫', imageUrl: '😫', nameAr: 'وجه متعب' },
        { name: '😩', imageUrl: '😩', nameAr: 'وجه يئن' },
        { name: '🥺', imageUrl: '🥺', nameAr: 'وجه متوسل' },
        { name: '😢', imageUrl: '😢', nameAr: 'وجه باكي' },
        { name: '😭', imageUrl: '😭', nameAr: 'وجه يبكي بصوت عالي' },
        { name: '😤', imageUrl: '😤', nameAr: 'وجه بخار من الأنف' },
        { name: '😠', imageUrl: '😠', nameAr: 'وجه غاضب' },
        { name: '😡', imageUrl: '😡', nameAr: 'وجه أحمر غاضب' },
        { name: '🤬', imageUrl: '🤬', nameAr: 'وجه بكلمات سيئة' },
        { name: '🤯', imageUrl: '🤯', nameAr: 'رأس منفجر' },
        { name: '😳', imageUrl: '😳', nameAr: 'وجه محمر' },
        { name: '🥵', imageUrl: '🥵', nameAr: 'وجه حار' },
        { name: '🥶', imageUrl: '🥶', nameAr: 'وجه بارد' },
        { name: '😱', imageUrl: '😱', nameAr: 'وجه يصرخ من الخوف' },
        { name: '😨', imageUrl: '😨', nameAr: 'وجه خائف' },
        { name: '😰', imageUrl: '😰', nameAr: 'وجه قلق بعرق' },
        { name: '😥', imageUrl: '😥', nameAr: 'وجه حزين لكن مرتاح' },
        { name: '😓', imageUrl: '😓', nameAr: 'وجه مرهق' },
        { name: '🤗', imageUrl: '🤗', nameAr: 'وجه معانق' },
        { name: '🤤', imageUrl: '🤤', nameAr: 'وجه يسيل لعابه' },
        { name: '😪', imageUrl: '😪', nameAr: 'وجه نعسان' },
        { name: '😴', imageUrl: '😴', nameAr: 'وجه نائم' },
        { name: '🥱', imageUrl: '🥱', nameAr: 'وجه يتثاءب' },
        { name: '😷', imageUrl: '😷', nameAr: 'وجه بكمامة طبية' },
        { name: '🤒', imageUrl: '🤒', nameAr: 'وجه بحمى' },
        { name: '🤕', imageUrl: '🤕', nameAr: 'وجه بضمادة' },
        { name: '🤢', imageUrl: '🤢', nameAr: 'وجه يتقيأ' },
        { name: '🤮', imageUrl: '🤮', nameAr: 'وجه يتقيأ' },
        { name: '🤧', imageUrl: '🤧', nameAr: 'وجه يعطس' },
        { name: '🥸', imageUrl: '🥸', nameAr: 'وجه متنكر' }
      ]},
      
      // Hearts and Love (قلوب وحب)
      { category: 'hearts', stickers: [
        { name: '❤️', imageUrl: '❤️', nameAr: 'قلب أحمر' },
        { name: '🧡', imageUrl: '🧡', nameAr: 'قلب برتقالي' },
        { name: '💛', imageUrl: '💛', nameAr: 'قلب أصفر' },
        { name: '💚', imageUrl: '💚', nameAr: 'قلب أخضر' },
        { name: '💙', imageUrl: '💙', nameAr: 'قلب أزرق' },
        { name: '💜', imageUrl: '💜', nameAr: 'قلب بنفسجي' },
        { name: '🖤', imageUrl: '🖤', nameAr: 'قلب أسود' },
        { name: '🤍', imageUrl: '🤍', nameAr: 'قلب أبيض' },
        { name: '🤎', imageUrl: '🤎', nameAr: 'قلب بني' },
        { name: '💔', imageUrl: '💔', nameAr: 'قلب مكسور' },
        { name: '❣️', imageUrl: '❣️', nameAr: 'تعجب قلب' },
        { name: '💕', imageUrl: '💕', nameAr: 'قلبان' },
        { name: '💞', imageUrl: '💞', nameAr: 'قلوب دوارة' },
        { name: '💓', imageUrl: '💓', nameAr: 'قلب نابض' },
        { name: '💗', imageUrl: '💗', nameAr: 'قلب متنامي' },
        { name: '💖', imageUrl: '💖', nameAr: 'قلب لامع' },
        { name: '💘', imageUrl: '💘', nameAr: 'قلب بسهم' },
        { name: '💝', imageUrl: '💝', nameAr: 'قلب بشريطة' },
        { name: '💟', imageUrl: '💟', nameAr: 'زخرفة قلب' }
      ]},
      
      // Food and Drinks (طعام ومشروبات)
      { category: 'food', stickers: [
        { name: '🍎', imageUrl: '🍎', nameAr: 'تفاحة حمراء' },
        { name: '🍊', imageUrl: '🍊', nameAr: 'برتقالة' },
        { name: '🍌', imageUrl: '🍌', nameAr: 'موزة' },
        { name: '🍇', imageUrl: '🍇', nameAr: 'عنب' },
        { name: '🍓', imageUrl: '🍓', nameAr: 'فراولة' },
        { name: '🥝', imageUrl: '🥝', nameAr: 'كيوي' },
        { name: '🍅', imageUrl: '🍅', nameAr: 'طماطم' },
        { name: '🥕', imageUrl: '🥕', nameAr: 'جزر' },
        { name: '🌽', imageUrl: '🌽', nameAr: 'ذرة' },
        { name: '🌶️', imageUrl: '🌶️', nameAr: 'فلفل حار' },
        { name: '🥒', imageUrl: '🥒', nameAr: 'خيار' },
        { name: '🥬', imageUrl: '🥬', nameAr: 'خس' },
        { name: '🥦', imageUrl: '🥦', nameAr: 'بروكلي' },
        { name: '🧄', imageUrl: '🧄', nameAr: 'ثوم' },
        { name: '🧅', imageUrl: '🧅', nameAr: 'بصل' },
        { name: '🍄', imageUrl: '🍄', nameAr: 'فطر' },
        { name: '🥜', imageUrl: '🥜', nameAr: 'فول سوداني' },
        { name: '🌰', imageUrl: '🌰', nameAr: 'كستناء' },
        { name: '🍞', imageUrl: '🍞', nameAr: 'خبز' },
        { name: '🥖', imageUrl: '🥖', nameAr: 'باغيت' },
        { name: '🥨', imageUrl: '🥨', nameAr: 'بريتزل' },
        { name: '🥯', imageUrl: '🥯', nameAr: 'بيغل' },
        { name: '🥞', imageUrl: '🥞', nameAr: 'فطائر' },
        { name: '🧇', imageUrl: '🧇', nameAr: 'وافل' },
        { name: '🧀', imageUrl: '🧀', nameAr: 'جبن' },
        { name: '🍖', imageUrl: '🍖', nameAr: 'لحم على العظم' },
        { name: '🍗', imageUrl: '🍗', nameAr: 'ساق دجاج' },
        { name: '🥩', imageUrl: '🥩', nameAr: 'قطعة لحم' },
        { name: '🥓', imageUrl: '🥓', nameAr: 'لحم مقدد' },
        { name: '🍔', imageUrl: '🍔', nameAr: 'همبرغر' },
        { name: '🍟', imageUrl: '🍟', nameAr: 'بطاطس مقلية' },
        { name: '🍕', imageUrl: '🍕', nameAr: 'بيتزا' },
        { name: '🌭', imageUrl: '🌭', nameAr: 'هوت دوغ' },
        { name: '🥪', imageUrl: '🥪', nameAr: 'شطيرة' },
        { name: '🌮', imageUrl: '🌮', nameAr: 'تاكو' },
        { name: '🌯', imageUrl: '🌯', nameAr: 'بوريتو' },
        { name: '🥙', imageUrl: '🥙', nameAr: 'خبز محشو' },
        { name: '🧆', imageUrl: '🧆', nameAr: 'فلافل' },
        { name: '🥚', imageUrl: '🥚', nameAr: 'بيضة' },
        { name: '🍳', imageUrl: '🍳', nameAr: 'طبخ' },
        { name: '🥘', imageUrl: '🥘', nameAr: 'مقلاة طعام' },
        { name: '🍲', imageUrl: '🍲', nameAr: 'وعاء طعام' },
        { name: '🥗', imageUrl: '🥗', nameAr: 'سلطة خضراء' },
        { name: '🍿', imageUrl: '🍿', nameAr: 'فشار' },
        { name: '🧈', imageUrl: '🧈', nameAr: 'زبدة' },
        { name: '🧂', imageUrl: '🧂', nameAr: 'ملح' },
        { name: '🥫', imageUrl: '🥫', nameAr: 'طعام معلب' }
      ]},
      
      // Hands and Gestures (أيدي وإيماءات)
      { category: 'hands', stickers: [
        { name: '👋', imageUrl: '👋', nameAr: 'يد تلوح' },
        { name: '🤚', imageUrl: '🤚', nameAr: 'ظهر اليد مرفوع' },
        { name: '🖐️', imageUrl: '🖐️', nameAr: 'يد مفتوحة' },
        { name: '✋', imageUrl: '✋', nameAr: 'يد مرفوعة' },
        { name: '🖖', imageUrl: '🖖', nameAr: 'تحية فولكان' },
        { name: '👌', imageUrl: '👌', nameAr: 'إشارة موافق' },
        { name: '🤌', imageUrl: '🤌', nameAr: 'أصابع مقروصة' },
        { name: '🤏', imageUrl: '🤏', nameAr: 'يد تقرص' },
        { name: '✌️', imageUrl: '✌️', nameAr: 'إشارة النصر' },
        { name: '🤞', imageUrl: '🤞', nameAr: 'أصابع متقاطعة' },
        { name: '🤟', imageUrl: '🤟', nameAr: 'إشارة أحبك' },
        { name: '🤘', imageUrl: '🤘', nameAr: 'إشارة الروك' },
        { name: '🤙', imageUrl: '🤙', nameAr: 'اتصل بي' },
        { name: '👈', imageUrl: '👈', nameAr: 'سبابة تشير يساراً' },
        { name: '👉', imageUrl: '👉', nameAr: 'سبابة تشير يميناً' },
        { name: '👆', imageUrl: '👆', nameAr: 'سبابة تشير فوق' },
        { name: '👇', imageUrl: '👇', nameAr: 'سبابة تشير تحت' },
        { name: '☝️', imageUrl: '☝️', nameAr: 'سبابة تشير فوق' },
        { name: '👍', imageUrl: '👍', nameAr: 'إبهام لأعلى' },
        { name: '👎', imageUrl: '👎', nameAr: 'إبهام لأسفل' },
        { name: '✊', imageUrl: '✊', nameAr: 'قبضة مرفوعة' },
        { name: '👊', imageUrl: '👊', nameAr: 'قبضة قادمة' },
        { name: '🤛', imageUrl: '🤛', nameAr: 'قبضة يسرى' },
        { name: '🤜', imageUrl: '🤜', nameAr: 'قبضة يمنى' },
        { name: '👏', imageUrl: '👏', nameAr: 'يدان تصفقان' },
        { name: '🙌', imageUrl: '🙌', nameAr: 'يدان مرفوعتان' },
        { name: '👐', imageUrl: '👐', nameAr: 'يدان مفتوحتان' },
        { name: '🤲', imageUrl: '🤲', nameAr: 'كفان مرفوعان' },
        { name: '🤝', imageUrl: '🤝', nameAr: 'مصافحة' },
        { name: '🙏', imageUrl: '🙏', nameAر: 'يدان متضرعتان' }
      ]},
      
      // Animals and Nature (حيوانات وطبيعة)
      { category: 'animals', stickers: [
        { name: '🐶', imageUrl: '🐶', nameAr: 'وجه كلب' },
        { name: '🐱', imageUrl: '🐱', nameAr: 'وجه قط' },
        { name: '🐭', imageUrl: '🐭', nameAr: 'وجه فأر' },
        { name: '🐹', imageUrl: '🐹', nameAr: 'وجه هامستر' },
        { name: '🐰', imageUrl: '🐰', nameAr: 'وجه أرنب' },
        { name: '🦊', imageUrl: '🦊', nameAr: 'وجه ثعلب' },
        { name: '🐻', imageUrl: '🐻', nameAr: 'وجه دب' },
        { name: '🐼', imageUrl: '🐼', nameAr: 'وجه باندا' },
        { name: '🐨', imageUrl: '🐨', nameAr: 'كوالا' },
        { name: '🐯', imageUrl: '🐯', nameAr: 'وجه نمر' },
        { name: '🦁', imageUrl: '🦁', nameAr: 'وجه أسد' },
        { name: '🐮', imageUrl: '🐮', nameAr: 'وجه بقرة' },
        { name: '🐷', imageUrl: '🐷', nameAr: 'وجه خنزير' },
        { name: '🐸', imageUrl: '🐸', nameAr: 'وجه ضفدع' },
        { name: '🐵', imageUrl: '🐵', nameAr: 'وجه قرد' },
        { name: '🙈', imageUrl: '🙈', nameAr: 'قرد لا يرى الشر' },
        { name: '🙉', imageUrl: '🙉', nameAr: 'قرد لا يسمع الشر' },
        { name: '🙊', imageUrl: '🙊', nameAr: 'قرد لا يتكلم الشر' },
        { name: '🐒', imageUrl: '🐒', nameAr: 'قرد' },
        { name: '🦍', imageUrl: '🦍', nameAr: 'غوريلا' },
        { name: '🦧', imageUrl: '🦧', nameAr: 'أورانغوتان' },
        { name: '🐕', imageUrl: '🐕', nameAr: 'كلب' },
        { name: '🐩', imageUrl: '🐩', nameAr: 'بودل' },
        { name: '🦮', imageUrl: '🦮', nameAر: 'كلب مرشد' },
        { name: '🐈', imageUrl: '🐈', nameAr: 'قط' },
        { name: '🦁', imageUrl: '🦁', nameAr: 'أسد' },
        { name: '🐅', imageUrl: '🐅', nameAr: 'نمر' },
        { name: '🐆', imageUrl: '🐆', nameAr: 'فهد' },
        { name: '🐴', imageUrl: '🐴', nameAr: 'وجه حصان' },
        { name: '🐎', imageUrl: '🐎', nameAr: 'حصان' },
        { name: '🦄', imageUrl: '🦄', nameAr: 'يونيكورن' },
        { name: '🦓', imageUrl: '🦓', nameAr: 'حمار وحشي' },
        { name: '🦒', imageUrl: '🦒', nameAr: 'زرافة' },
        { name: '🐘', imageUrl: '🐘', nameAr: 'فيل' },
        { name: '🦏', imageUrl: '🦏', nameAr: 'وحيد القرن' },
        { name: '🦛', imageUrl: '🦛', nameAr: 'فرس النهر' },
        { name: '🐪', imageUrl: '🐪', nameAr: 'جمل' },
        { name: '🐫', imageUrl: '🐫', nameAr: 'جمل ذو سنامين' },
        { name: '🦙', imageUrl: '🦙', nameAr: 'لاما' },
        { name: '🦘', imageUrl: '🦘', nameAr: 'كنغر' },
        { name: '🐃', imageUrl: '🐃', nameAr: 'جاموس مائي' },
        { name: '🐂', imageUrl: '🐂', nameAr: 'ثور' },
        { name: '🐄', imageUrl: '🐄', nameAr: 'بقرة' },
        { name: '🐖', imageUrl: '🐖', nameAr: 'خنزير' },
        { name: '🐗', imageUrl: '🐗', nameAr: 'خنزير بري' },
        { name: '🐏', imageUrl: '🐏', nameAr: 'كبش' },
        { name: '🐑', imageUrl: '🐑', nameAr: 'خروف' },
        { name: '🐐', imageUrl: '🐐', nameAr: 'ماعز' },
        { name: '🦌', imageUrl: '🦌', nameAr: 'غزال' },
        { name: '🐺', imageUrl: '🐺', nameAr: 'ذئب' },
        { name: '🦝', imageUrl: '🦝', nameAr: 'راكون' },
        { name: '🦨', imageUrl: '🦨', nameAr: 'ظربان' },
        { name: '🦡', imageUrl: '🦡', nameAr: 'غرير' },
        { name: '🐾', imageUrl: '🐾', nameAr: 'آثار أقدام' }
      ]},
      
      // Sports and Activities (رياضة وأنشطة)
      { category: 'sports', stickers: [
        { name: '⚽', imageUrl: '⚽', nameAr: 'كرة قدم' },
        { name: '🏀', imageUrl: '🏀', nameAr: 'كرة سلة' },
        { name: '🏈', imageUrl: '🏈', nameAr: 'كرة قدم أمريكية' },
        { name: '⚾', imageUrl: '⚾', nameAr: 'بيسبول' },
        { name: '🥎', imageUrl: '🥎', nameAr: 'سوفت بول' },
        { name: '🎾', imageUrl: '🎾', nameAr: 'تنس' },
        { name: '🏐', imageUrl: '🏐', nameAr: 'كرة طائرة' },
        { name: '🏉', imageUrl: '🏉', nameAr: 'رغبي' },
        { name: '🥏', imageUrl: '🥏', nameAr: 'قرص طائر' },
        { name: '🎱', imageUrl: '🎱', nameAr: 'بلياردو' },
        { name: '🪀', imageUrl: '🪀', nameAr: 'يو-يو' },
        { name: '🏓', imageUrl: '🏓', nameAr: 'تنس طاولة' },
        { name: '🏸', imageUrl: '🏸', nameAr: 'باد منتن' },
        { name: '🏒', imageUrl: '🏒', nameAr: 'هوكي' },
        { name: '🏑', imageUrl: '🏑', nameAr: 'هوكي ميداني' },
        { name: '🥍', imageUrl: '🥍', nameAr: 'لاكروس' },
        { name: '🏏', imageUrl: '🏏', nameAr: 'كريكت' },
        { name: '🥅', imageUrl: '🥅', nameAr: 'مرمى' },
        { name: '⛳', imageUrl: '⛳', nameAr: 'علم في حفرة' },
        { name: '🪁', imageUrl: '🪁', nameAr: 'طائرة ورقية' },
        { name: '🏹', imageUrl: '🏹', nameAr: 'قوس وسهم' },
        { name: '🎣', imageUrl: '🎣', nameAr: 'صيد سمك' },
        { name: '🤿', imageUrl: '🤿', nameAr: 'قناع غوص' },
        { name: '🥊', imageUrl: '🥊', nameAr: 'قفاز ملاكمة' },
        { name: '🥋', imageUrl: '🥋', nameAr: 'زي فنون قتالية' },
        { name: '🎽', imageUrl: '🎽', nameAr: 'قميص جري' },
        { name: '🛹', imageUrl: '🛹', nameAr: 'لوح تزلج' },
        { name: '🛼', imageUrl: '🛼', nameAr: 'حذاء تزلج' },
        { name: '🛷', imageUrl: '🛷', nameAr: 'زحافة' },
        { name: '⛸️', imageUrl: '⛸️', nameAr: 'حذاء تزلج على الجليد' },
        { name: '🥌', imageUrl: '🥌', nameAr: 'حجر كيرلنغ' },
        { name: '🎿', imageUrl: '🎿', nameAr: 'تزلج' }
      ]},
      
      // Transportation (مواصلات)
      { category: 'transport', stickers: [
        { name: '🚗', imageUrl: '🚗', nameAr: 'سيارة' },
        { name: '🚕', imageUrl: '🚕', nameAr: 'تاكسي' },
        { name: '🚙', imageUrl: '🚙', nameAr: 'سيارة دفع رباعي' },
        { name: '🚌', imageUrl: '🚌', nameAr: 'حافلة' },
        { name: '🚎', imageUrl: '🚎', nameAr: 'ترولي باص' },
        { name: '🏎️', imageUrl: '🏎️', nameAr: 'سيارة سباق' },
        { name: '🚓', imageUrl: '🚓', nameAr: 'سيارة شرطة' },
        { name: '🚑', imageUrl: '🚑', nameAr: 'إسعاف' },
        { name: '🚒', imageUrl: '🚒', nameAر: 'شاحنة إطفاء' },
        { name: '🚐', imageUrl: '🚐', nameAr: 'ميني باص' },
        { name: '🛻', imageUrl: '🛻', nameAr: 'شاحنة صغيرة' },
        { name: '🚚', imageUrl: '🚚', nameAr: 'شاحنة توصيل' },
        { name: '🚛', imageUrl: '🚛', nameAr: 'شاحنة مقطورة' },
        { name: '🚜', imageUrl: '🚜', nameAr: 'جرار' },
        { name: '🏍️', imageUrl: '🏍️', nameAr: 'دراجة نارية' },
        { name: '🛵', imageUrl: '🛵', nameAr: 'سكوتر' },
        { name: '🚲', imageUrl: '🚲', nameAr: 'دراجة' },
        { name: '🛴', imageUrl: '🛴', nameAr: 'سكوتر ركل' },
        { name: '🚁', imageUrl: '🚁', nameAr: 'مروحية' },
        { name: '✈️', imageUrl: '✈️', nameAr: 'طائرة' },
        { name: '🛫', imageUrl: '🛫', nameAr: 'طائرة تقلع' },
        { name: '🛬', imageUrl: '🛬', nameAr: 'طائرة تهبط' },
        { name: '🪂', imageUrl: '🪂', nameAr: 'مظلة هبوط' },
        { name: '💺', imageUrl: '💺', nameAr: 'مقعد' },
        { name: '🚀', imageUrl: '🚀', nameAr: 'صاروخ' },
        { name: '🛸', imageUrl: '🛸', nameAr: 'طبق طائر' }
      ]},
      
      // Business and Money (أعمال ومال)
      { category: 'business', stickers: [
        { name: '💰', imageUrl: '💰', nameAr: 'كيس نقود' },
        { name: '💴', imageUrl: '💴', nameAr: 'ين ياباني' },
        { name: '💵', imageUrl: '💵', nameAr: 'دولار' },
        { name: '💶', imageUrl: '💶', nameAر: 'يورو' },
        { name: '💷', imageUrl: '💷', nameAr: 'جنيه إسترليني' },
        { name: '💸', imageUrl: '💸', nameAr: 'نقود بأجنحة' },
        { name: '💳', imageUrl: '💳', nameAr: 'بطاقة ائتمان' },
        { name: '🧾', imageUrl: '🧾', nameAr: 'إيصال' },
        { name: '💎', imageUrl: '💎', nameAr: 'جوهرة' },
        { name: '⚖️', imageUrl: '⚖️', nameAر: 'ميزان' },
        { name: '🔧', imageUrl: '🔧', nameAr: 'مفتاح ربط' },
        { name: '🔨', imageUrl: '🔨', nameAr: 'مطرقة' },
        { name: '⚒️', imageUrl: '⚒️', nameAr: 'مطرقة ومعول' },
        { name: '🛠️', imageUrl: '🛠️', nameAr: 'مطرقة ومفتاح ربط' },
        { name: '⛏️', imageUrl: '⛏️', nameAr: 'معول' },
        { name: '🔩', imageUrl: '🔩', nameAr: 'صامولة ومسمار' },
        { name: '⚙️', imageUrl: '⚙️', nameAr: 'ترس' },
        { name: '🧰', imageUrl: '🧰', nameAr: 'صندوق أدوات' },
        { name: '🧲', imageUrl: '🧲', nameAr: 'مغناطيس' },
        { name: '📈', imageUrl: '📈', nameAr: 'مخطط بياني صاعد' },
        { name: '📉', imageUrl: '📉', nameAr: 'مخطط بياني هابط' },
        { name: '📊', imageUrl: '📊', nameAr: 'مخطط بياني' }
      ]},
      
      // Technology (تكنولوجيا)
      { category: 'technology', stickers: [
        { name: '📱', imageUrl: '📱', nameAr: 'هاتف محمول' },
        { name: '💻', imageUrl: '💻', nameAr: 'لابتوب' },
        { name: '🖥️', imageUrl: '🖥️', nameAr: 'كمبيوتر مكتبي' },
        { name: '🖨️', imageUrl: '🖨️', nameAr: 'طابعة' },
        { name: '⌨️', imageUrl: '⌨️', nameAr: 'لوحة مفاتيح' },
        { name: '🖱️', imageUrl: '🖱️', nameAr: 'فأرة كمبيوتر' },
        { name: '💽', imageUrl: '💽', nameAr: 'قرص مضغوط' },
        { name: '💾', imageUrl: '💾', nameAr: 'قرص مرن' },
        { name: '💿', imageUrl: '💿', nameAr: 'قرص بصري' },
        { name: '📀', imageUrl: '📀', nameAr: 'دي في دي' },
        { name: '🎥', imageUrl: '🎥', nameAr: 'كاميرا أفلام' },
        { name: '📹', imageUrl: '📹', nameAr: 'كاميرا فيديو' },
        { name: '📷', imageUrl: '📷', nameAr: 'كاميرا' },
        { name: '📸', imageUrl: '📸', nameAr: 'كاميرا بفلاش' },
        { name: '📻', imageUrl: '📻', nameAر: 'راديو' },
        { name: '🎙️', imageUrl: '🎙️', nameAr: 'ميكروفون استوديو' },
        { name: '⏱️', imageUrl: '⏱️', nameAr: 'ساعة توقيت' },
        { name: '⏲️', imageUrl: '⏲️', nameAr: 'مؤقت' },
        { name: '⏰', imageUrl: '⏰', nameAr: 'منبه' },
        { name: '⌚', imageUrl: '⌚', nameAr: 'ساعة' },
        { name: '📲', imageUrl: '📲', nameAr: 'هاتف بسهم' },
        { name: '☎️', imageUrl: '☎️', nameAr: 'هاتف' },
        { name: '📞', imageUrl: '📞', nameAr: 'سماعة هاتف' },
        { name: '🔋', imageUrl: '🔋', nameAr: 'بطارية' },
        { name: '🔌', imageUrl: '🔌', nameAr: 'قابس كهربائي' },
        { name: '💡', imageUrl: '💡', nameAr: 'مصباح' },
        { name: '🔦', imageUrl: '🔦', nameAr: 'كشاف' }
      ]},
      
      // Weather and Nature (طقس وطبيعة)
      { category: 'weather', stickers: [
        { name: '☀️', imageUrl: '☀️', nameAr: 'شمس' },
        { name: '🌞', imageUrl: '🌞', nameAr: 'شمس بوجه' },
        { name: '🌝', imageUrl: '🌝', nameAr: 'قمر بدر بوجه' },
        { name: '🌛', imageUrl: '🌛', nameAr: 'هلال بوجه' },
        { name: '🌜', imageUrl: '🌜', nameAr: 'هلال بوجه' },
        { name: '🌚', imageUrl: '🌚', nameAr: 'قمر محاق بوجه' },
        { name: '🌕', imageUrl: '🌕', nameAr: 'قمر بدر' },
        { name: '🌙', imageUrl: '🌙', nameAr: 'هلال' },
        { name: '⭐', imageUrl: '⭐', nameAr: 'نجمة' },
        { name: '🌟', imageUrl: '🌟', nameAr: 'نجمة متوهجة' },
        { name: '✨', imageUrl: '✨', nameAr: 'بريق' },
        { name: '⚡', imageUrl: '⚡', nameAr: 'برق' },
        { name: '☄️', imageUrl: '☄️', nameAr: 'مذنب' },
        { name: '💥', imageUrl: '💥', nameAr: 'انفجار' },
        { name: '🔥', imageUrl: '🔥', nameAr: 'نار' },
        { name: '🌪️', imageUrl: '🌪️', nameAr: 'إعصار' },
        { name: '🌈', imageUrl: '🌈', nameAr: 'قوس قزح' },
        { name: '☁️', imageUrl: '☁️', nameAr: 'سحابة' },
        { name: '⛅', imageUrl: '⛅', nameAr: 'شمس خلف سحابة' },
        { name: '⛈️', imageUrl: '⛈️', nameAr: 'سحابة برق ومطر' },
        { name: '🌧️', imageUrl: '🌧️', nameAr: 'سحابة مطر' },
        { name: '❄️', imageUrl: '❄️', nameAr: 'ندفة ثلج' },
        { name: '☃️', imageUrl: '☃️', nameAr: 'رجل ثلج' },
        { name: '⛄', imageUrl: '⛄', nameAr: 'رجل ثلج بدون ثلج' },
        { name: '☔', imageUrl: '☔', nameAr: 'مظلة بقطرات مطر' },
        { name: '💧', imageUrl: '💧', nameAr: 'قطرة ماء' },
        { name: '🌊', imageUrl: '🌊', nameAr: 'موجة مياه' }
      ]},
      
      // Travel and Places (سفر وأماكن)
      { category: 'travel', stickers: [
        { name: '🏔️', imageUrl: '🏔️', nameAr: 'جبل مثلج' },
        { name: '⛰️', imageUrl: '⛰️', nameAr: 'جبل' },
        { name: '🌋', imageUrl: '🌋', nameAr: 'بركان' },
        { name: '🏕️', imageUrl: '🏕️', nameAr: 'تخييم' },
        { name: '🏖️', imageUrl: '🏖️', nameAr: 'شاطئ بمظلة' },
        { name: '🏜️', imageUrl: '🏜️', nameAr: 'صحراء' },
        { name: '🏝️', imageUrl: '🏝️', nameAr: 'جزيرة صحراوية' },
        { name: '🏞️', imageUrl: '🏞️', nameAr: 'حديقة وطنية' },
        { name: '🏟️', imageUrl: '🏟️', nameAr: 'استاد' },
        { name: '🏛️', imageUrl: '🏛️', nameAr: 'مبنى كلاسيكي' },
        { name: '🏗️', imageUrl: '🏗️', nameAر: 'مبنى قيد الإنشاء' },
        { name: '🏘️', imageUrl: '🏘️', nameAr: 'منازل' },
        { name: '🏠', imageUrl: '🏠', nameAr: 'منزل' },
        { name: '🏡', imageUrl: '🏡', nameAr: 'منزل بحديقة' },
        { name: '🏢', imageUrl: '🏢', nameAr: 'مبنى مكاتب' },
        { name: '🏥', imageUrl: '🏥', nameAr: 'مستشفى' },
        { name: '🏦', imageUrl: '🏦', nameAر: 'بنك' },
        { name: '🏨', imageUrl: '🏨', nameAr: 'فندق' },
        { name: '🏪', imageUrl: '🏪', nameAr: 'متجر صغير' },
        { name: '🏫', imageUrl: '🏫', nameAr: 'مدرسة' },
        { name: '🏬', imageUrl: '🏬', nameAr: 'متجر كبير' },
        { name: '🏭', imageUrl: '🏭', nameAr: 'مصنع' },
        { name: '🏯', imageUrl: '🏯', nameAr: 'قلعة يابانية' },
        { name: '🏰', imageUrl: '🏰', nameAr: 'قلعة' },
        { name: '💒', imageUrl: '💒', nameAr: 'زفاف' },
        { name: '🗼', imageUrl: '🗼', nameAr: 'برج طوكيو' },
        { name: '🗽', imageUrl: '🗽', nameAr: 'تمثال الحرية' },
        { name: '⛪', imageUrl: '⛪', nameAr: 'كنيسة' },
        { name: '🕌', imageUrl: '🕌', nameAr: 'مسجد' },
        { name: '🕋', imageUrl: '🕋', nameAr: 'كعبة' }
      ]},
      
      // Symbols and Signs (رموز وعلامات)
      { category: 'symbols', stickers: [
        { name: '💯', imageUrl: '💯', nameAr: 'مئة نقطة' },
        { name: '💢', imageUrl: '💢', nameAr: 'رمز غضب' },
        { name: '💬', imageUrl: '💬', nameAr: 'فقاعة كلام' },
        { name: '💭', imageUrl: '💭', nameAr: 'فقاعة فكر' },
        { name: '💤', imageUrl: '💤', nameAr: 'رمز نوم' },
        { name: '💨', imageUrl: '💨', nameAr: 'اندفاع' },
        { name: '🌟', imageUrl: '🌟', nameAr: 'نجمة متوهجة' },
        { name: '💫', imageUrl: '💫', nameAr: 'دوامة' },
        { name: '🌠', imageUrl: '🌠', nameAr: 'نجمة متساقطة' },
        { name: '🎆', imageUrl: '🎆', nameAr: 'ألعاب نارية' },
        { name: '🎇', imageUrl: '🎇', nameAr: 'شرارة' },
        { name: '🎉', imageUrl: '🎉', nameAr: 'منفاخ حفلة' },
        { name: '🎊', imageUrl: '🎊', nameAr: 'كرة كونفيتي' },
        { name: '🎈', imageUrl: '🎈', nameAr: 'بالون' },
        { name: '🎀', imageUrl: '🎀', nameAr: 'شريطة' },
        { name: '🎁', imageUrl: '🎁', nameAr: 'هدية ملفوفة' },
        { name: '🔮', imageUrl: '🔮', nameAr: 'كرة بلورية' },
        { name: '🧿', imageUrl: '🧿', nameAر: 'عين نازار' },
        { name: '📿', imageUrl: '📿', nameAr: 'مسبحة' }
      ]},
      
      // Flags (أعلام)
      { category: 'flags', stickers: [
        { name: '🇸🇦', imageUrl: '🇸🇦', nameAr: 'علم السعودية' },
        { name: '🇦🇪', imageUrl: '🇦🇪', nameAr: 'علم الإمارات' },
        { name: '🇪🇬', imageUrl: '🇪🇬', nameAr: 'علم مصر' },
        { name: '🇯🇴', imageUrl: '🇯🇴', nameAr: 'علم الأردن' },
        { name: '🇱🇧', imageUrl: '🇱🇧', nameAr: 'علم لبنان' },
        { name: '🇸🇾', imageUrl: '🇸🇾', nameAr: 'علم سوريا' },
        { name: '🇮🇶', imageUrl: '🇮🇶', nameAr: 'علم العراق' },
        { name: '🇰🇼', imageUrl: '🇰🇼', nameAr: 'علم الكويت' },
        { name: '🇧🇭', imageUrl: '🇧🇭', nameAr: 'علم البحرين' },
        { name: '🇶🇦', imageUrl: '🇶🇦', nameAr: 'علم قطر' },
        { name: '🇴🇲', imageUrl: '🇴🇲', nameAر: 'علم عمان' },
        { name: '🇾🇪', imageUrl: '🇾🇪', nameAr: 'علم اليمن' },
        { name: '🇵🇸', imageUrl: '🇵🇸', nameAr: 'علم فلسطين' },
        { name: '🇲🇦', imageUrl: '🇲🇦', nameAr: 'علم المغرب' },
        { name: '🇩🇿', imageUrl: '🇩🇿', nameAr: 'علم الجزائر' },
        { name: '🇹🇳', imageUrl: '🇹🇳', nameAر: 'علم تونس' },
        { name: '🇱🇾', imageUrl: '🇱🇾', nameAr: 'علم ليبيا' },
        { name: '🇸🇩', imageUrl: '🇸🇩', nameAr: 'علم السودان' },
        { name: '🇸🇴', imageUrl: '🇸🇴', nameAr: 'علم الصومال' },
        { name: '🇩🇯', imageUrl: '🇩🇯', nameAr: 'علم جيبوتي' },
        { name: '🇲🇷', imageUrl: '🇲🇷', nameAr: 'علم موريتانيا' },
        { name: '🇰🇲', imageUrl: '🇰🇲', nameAr: 'علم جزر القمر' },
        { name: '🇹🇷', imageUrl: '🇹🇷', nameAr: 'علم تركيا' },
        { name: '🇮🇷', imageUrl: '🇮🇷', nameAr: 'علم إيران' }
      ]}
    ];

    // Add all stickers to storage
    let sortOrder = 0;
    stickerCategories.forEach(categoryData => {
      categoryData.stickers.forEach(sticker => {
        this.stickers.push({
          id: `sticker-${sortOrder}`,
          name: sticker.name,
          imageUrl: sticker.imageUrl,
          category: categoryData.category,
          isActive: true,
          sortOrder: sortOrder++,
          createdAt: new Date()
        });
      });
    });

    console.log(`📦 تم تحميل ${this.stickers.length} ملصق مجاني في ${stickerCategories.length} فئات`);
  }

  // Admin management methods for MemStorage
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUserAdminStatus(userId: string, isAdmin: boolean): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    user.isAdmin = isAdmin;
    user.updatedAt = new Date();
    this.users.set(userId, user);
    return user;
  }

  async updateUserVerificationStatus(userId: string, isVerified: boolean): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    user.isVerified = isVerified;
    user.verifiedAt = isVerified ? new Date() : null;
    user.updatedAt = new Date();
    this.users.set(userId, user);
    return user;
  }

  // Stickers implementation for MemStorage
  async getAllStickers(): Promise<any[]> {
    return this.stickers.filter(sticker => sticker.isActive);
  }

  async getStickersByCategory(category?: string): Promise<Sticker[]> {
    if (!category) return this.stickers;
    return this.stickers.filter(sticker => sticker.category === category);
  }

  async addSticker(sticker: any): Promise<any> {
    const newSticker = {
      id: randomUUID(),
      ...sticker,
      createdAt: new Date()
    };
    this.stickers.push(newSticker);
    return newSticker;
  }
  
  // Cart implementation for MemStorage
  async getCartItems(userId: string): Promise<any[]> {
    return [];
  }
  
  async addToCart(userId: string, productId: string, quantity: number): Promise<any> {
    return { id: randomUUID(), userId, productId, quantity };
  }
  
  async removeFromCart(userId: string, cartItemId: string): Promise<void> {
    // Mock implementation
  }
  
  async updateCartItemQuantity(userId: string, cartItemId: string, quantity: number): Promise<any> {
    return { id: cartItemId, quantity };
  }

  // Verification requests methods for MemStorage
  async createVerificationRequest(request: InsertVerificationRequest): Promise<VerificationRequest> {
    const newRequest: VerificationRequest = {
      id: randomUUID(),
      ...request,
      submittedAt: new Date(),
      reviewedAt: null,
    };
    return newRequest;
  }

  async getVerificationRequests(userId?: string): Promise<VerificationRequest[]> {
    return [];
  }

  async getUserVerificationRequests(userId: string): Promise<VerificationRequest[]> {
    return [];
  }

  async getVerificationRequest(requestId: string): Promise<VerificationRequest | undefined> {
    return undefined;
  }

  async getAllVerificationRequests(status?: string): Promise<VerificationRequest[]> {
    return [];
  }

  async updateVerificationRequest(requestId: string, updates: Partial<Pick<VerificationRequest, 'status' | 'adminNote' | 'reviewedBy'>>): Promise<VerificationRequest | undefined> {
    return undefined;
  }

  // Stores and products methods for MemStorage
  async getStores(location?: string, category?: string): Promise<Store[]> {
    return [];
  }

  async getStore(storeId: string): Promise<Store | undefined> {
    return undefined;
  }

  async getUserStore(userId: string): Promise<Store | undefined> {
    return undefined;
  }

  async createStore(store: InsertStore): Promise<Store> {
    const newStore: Store = {
      id: randomUUID(),
      ...store,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      status: 'pending',
      reviewedBy: null,
      reviewedAt: null,
      rejectionReason: null,
      rating: 0,
      totalSales: 0
    };
    return newStore;
  }

  async updateStore(storeId: string, updates: Partial<InsertStore>): Promise<Store | undefined> {
    return undefined;
  }

  async updateStoreStatus(storeId: string, status: string, reviewedBy: string, rejectionReason?: string): Promise<Store | undefined> {
    return undefined;
  }

  async getStoreProducts(storeId: string): Promise<Product[]> {
    return [];
  }

  async getUserProducts(userId: string): Promise<Product[]> {
    return [];
  }

  // Admin dashboard stats for MemStorage
  async getAdminDashboardStats(): Promise<any> {
    return {
      pendingVerificationRequests: 0,
      totalVerificationRequests: 0,
      totalUsers: this.users.size,
      totalStores: 0,
      todayRequests: 0,
      totalRevenue: 0
    };
  }

  // Call management methods for MemStorage
  async createCall(callData: any): Promise<any> {
    const call = {
      id: randomUUID(),
      ...callData,
      startedAt: new Date(),
      duration: 0
    };
    this.calls.set(call.id, call);
    console.log('📞 مكالمة جديدة تم إنشاؤها:', call.id);
    return call;
  }

  async getCallById(callId: string): Promise<any> {
    return this.calls.get(callId);
  }

  async updateCallStatus(callId: string, status: string): Promise<any> {
    const call = this.calls.get(callId);
    if (call) {
      call.status = status;
      if (status === 'accepted') {
        call.acceptedAt = new Date();
      }
      this.calls.set(callId, call);
      console.log('📞 تم تحديث حالة المكالمة:', callId, 'إلى:', status);
    }
    return call;
  }

  async endCall(callId: string, duration: number = 0): Promise<any> {
    const call = this.calls.get(callId);
    if (call) {
      call.status = 'ended';
      call.endedAt = new Date();
      call.duration = duration;
      this.calls.set(callId, call);
      console.log('📞 تم إنهاء المكالمة:', callId, 'مدة:', duration, 'ثانية');
    }
    return call;
  }

  async getActiveCallsForUser(userId: string): Promise<any[]> {
    const activeCalls: any[] = [];
    for (const call of this.calls.values()) {
      if ((call.callerId === userId || call.receiverId === userId) && 
          (call.status === 'ringing' || call.status === 'accepted')) {
        activeCalls.push(call);
      }
    }
    return activeCalls;
  }

  async getCallHistoryForUser(userId: string): Promise<any[]> {
    const callHistory: any[] = [];
    for (const call of this.calls.values()) {
      if (call.callerId === userId || call.receiverId === userId) {
        callHistory.push(call);
      }
    }
    // ترتيب حسب التاريخ من الأحدث للأقدم
    return callHistory.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }

  // Store methods
  async getStores(location?: string, category?: string): Promise<Store[]> {
    let storesList = Array.from(this.stores.values());
    
    if (location) {
      storesList = storesList.filter(store => store.location === location);
    }
    
    if (category) {
      storesList = storesList.filter(store => store.category === category);
    }
    
    return storesList;
  }

  async getAllStores(): Promise<Store[]> {
    return Array.from(this.stores.values());
  }

  async getStore(storeId: string): Promise<Store | undefined> {
    return this.stores.get(storeId);
  }

  async getUserStore(userId: string): Promise<Store | undefined> {
    return Array.from(this.stores.values()).find(store => store.userId === userId);
  }

  async createStore(store: InsertStore): Promise<Store> {
    const newStore: Store = {
      id: randomUUID(),
      ...store,
      isActive: store.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.stores.set(newStore.id, newStore);
    return newStore;
  }

  async updateStore(storeId: string, updates: Partial<InsertStore>): Promise<Store | undefined> {
    const store = this.stores.get(storeId);
    if (!store) return undefined;

    const updatedStore = { ...store, ...updates, updatedAt: new Date() };
    this.stores.set(storeId, updatedStore);
    return updatedStore;
  }

  async updateStoreStatus(storeId: string, isActive: boolean): Promise<Store | undefined> {
    return this.updateStore(storeId, { isActive });
  }

  async deleteStore(storeId: string): Promise<boolean> {
    return this.stores.delete(storeId);
  }

  // Product methods
  async getProducts(location?: string, category?: string): Promise<Product[]> {
    let productsList = Array.from(this.products.values());
    
    if (location) {
      productsList = productsList.filter(product => product.location === location);
    }
    
    if (category) {
      productsList = productsList.filter(product => product.category === category);
    }
    
    return productsList;
  }

  async getProduct(productId: string): Promise<Product | undefined> {
    return this.products.get(productId);
  }

  async getUserProducts(userId: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => product.userId === userId);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const newProduct: Product = {
      id: randomUUID(),
      ...product,
      isActive: product.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.products.set(newProduct.id, newProduct);
    return newProduct;
  }

  async updateProduct(productId: string, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(productId);
    if (!product) return undefined;

    const updatedProduct = { ...product, ...updates, updatedAt: new Date() };
    this.products.set(productId, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(productId: string): Promise<boolean> {
    return this.products.delete(productId);
  }

  // Affiliate methods (stub implementation)
  async createAffiliateLink(affiliateLink: InsertAffiliateLink): Promise<AffiliateLink> {
    const newLink: AffiliateLink = {
      id: randomUUID(),
      ...affiliateLink,
      clicks: 0,
      conversions: 0,
      createdAt: new Date(),
    };
    this.affiliateLinks.set(newLink.id, newLink);
    return newLink;
  }

  async getUserAffiliateLinks(userId: string): Promise<AffiliateLink[]> {
    return Array.from(this.affiliateLinks.values()).filter(link => link.userId === userId);
  }

  async getAffiliateLink(linkId: string): Promise<AffiliateLink | undefined> {
    return this.affiliateLinks.get(linkId);
  }

  async trackClick(linkId: string): Promise<void> {
    const link = this.affiliateLinks.get(linkId);
    if (link) {
      link.clicks += 1;
      this.affiliateLinks.set(linkId, link);
    }
  }

  async trackConversion(linkId: string, amount: number): Promise<void> {
    const link = this.affiliateLinks.get(linkId);
    if (link) {
      link.conversions += 1;
      this.affiliateLinks.set(linkId, link);
    }
  }

  // Commission methods (stub implementation)
  async getUserCommissions(userId: string): Promise<Commission[]> {
    return Array.from(this.commissions.values()).filter(commission => commission.userId === userId);
  }

  async getTotalCommissions(userId: string): Promise<number> {
    return Array.from(this.commissions.values())
      .filter(commission => commission.userId === userId)
      .reduce((total, commission) => total + commission.amount, 0);
  }

  async getCommissionsByStatus(userId: string, status: string): Promise<Commission[]> {
    return Array.from(this.commissions.values())
      .filter(commission => commission.userId === userId && commission.status === status);
  }

  // Contact methods (stub implementation)
  async getUserContacts(userId: string): Promise<Contact[]> {
    return Array.from(this.contacts.values()).filter(contact => contact.userId === userId);
  }

  async addContact(userId: string, contactPhoneNumber: string): Promise<Contact> {
    const newContact: Contact = {
      id: randomUUID(),
      userId,
      contactPhoneNumber,
      addedAt: new Date(),
    };
    this.contacts.set(newContact.id, newContact);
    return newContact;
  }

  async searchUserByPhoneNumber(phoneNumber: string): Promise<User | undefined> {
    return this.getUserByPhoneNumber(phoneNumber);
  }

  // Cart methods (stub implementation)
  async getCartItems(userId: string): Promise<CartItem[]> {
    return Array.from(this.cartItems.values()).filter(item => item.userId === userId);
  }

  async addToCart(userId: string, productId: string, quantity: number): Promise<CartItem> {
    const newCartItem: CartItem = {
      id: randomUUID(),
      userId,
      productId,
      quantity,
      addedAt: new Date(),
    };
    this.cartItems.set(newCartItem.id, newCartItem);
    return newCartItem;
  }

  async removeFromCart(userId: string, cartItemId: string): Promise<void> {
    this.cartItems.delete(cartItemId);
  }

  async updateCartItemQuantity(userId: string, cartItemId: string, quantity: number): Promise<CartItem | undefined> {
    const cartItem = this.cartItems.get(cartItemId);
    if (cartItem && cartItem.userId === userId) {
      cartItem.quantity = quantity;
      this.cartItems.set(cartItemId, cartItem);
      return cartItem;
    }
    return undefined;
  }

  async clearCart(userId: string): Promise<void> {
    for (const [id, item] of this.cartItems.entries()) {
      if (item.userId === userId) {
        this.cartItems.delete(id);
      }
    }
  }

  // Order methods (stub implementation)
  async createOrder(order: InsertOrder): Promise<Order> {
    const newOrder: Order = {
      id: randomUUID(),
      ...order,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.orders.set(newOrder.id, newOrder);
    return newOrder;
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.buyerId === userId);
  }

  async getSellerOrders(sellerId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.sellerId === sellerId);
  }

  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrder(orderId: string): Promise<Order | undefined> {
    return this.orders.get(orderId);
  }

  async updateOrderStatus(orderId: string, status: string): Promise<Order | undefined> {
    const order = this.orders.get(orderId);
    if (order) {
      order.status = status;
      order.updatedAt = new Date();
      this.orders.set(orderId, order);
      return order;
    }
    return undefined;
  }

  async cancelOrder(orderId: string): Promise<Order | undefined> {
    return this.updateOrderStatus(orderId, 'cancelled');
  }

  // Verification methods (stub implementation)
  async getUserVerificationRequests(userId: string): Promise<VerificationRequest[]> {
    return Array.from(this.verificationRequests.values()).filter(req => req.userId === userId);
  }

  async getAllVerificationRequests(): Promise<VerificationRequest[]> {
    return Array.from(this.verificationRequests.values());
  }

  async createVerificationRequest(request: InsertVerificationRequest): Promise<VerificationRequest> {
    const newRequest: VerificationRequest = {
      id: randomUUID(),
      ...request,
      submittedAt: new Date(),
    };
    this.verificationRequests.set(newRequest.id, newRequest);
    return newRequest;
  }

  async updateVerificationRequest(requestId: string, updates: Partial<VerificationRequest>): Promise<VerificationRequest | undefined> {
    const request = this.verificationRequests.get(requestId);
    if (request) {
      Object.assign(request, updates);
      this.verificationRequests.set(requestId, request);
      return request;
    }
    return undefined;
  }

  // Placeholder implementations for new addictive features - not functional in memory storage
  async getNeighborhoodGroups(location?: string): Promise<NeighborhoodGroup[]> { return []; }
  async getNeighborhoodGroup(groupId: string): Promise<NeighborhoodGroup | undefined> { return undefined; }
  async createNeighborhoodGroup(group: InsertNeighborhoodGroup): Promise<NeighborhoodGroup> { 
    throw new Error('NeighborhoodGroups require database storage'); 
  }
  async joinNeighborhoodGroup(groupId: string, userId: string): Promise<void> { }
  async leaveNeighborhoodGroup(groupId: string, userId: string): Promise<void> { }
  async getUserNeighborhoodGroups(userId: string): Promise<NeighborhoodGroup[]> { return []; }
  
  async getHelpRequests(groupId?: string, status?: string): Promise<HelpRequest[]> { return []; }
  async getHelpRequest(requestId: string): Promise<HelpRequest | undefined> { return undefined; }
  async createHelpRequest(request: InsertHelpRequest): Promise<HelpRequest> { 
    throw new Error('HelpRequests require database storage'); 
  }
  async acceptHelpRequest(requestId: string, helperId: string): Promise<HelpRequest | undefined> { return undefined; }
  async completeHelpRequest(requestId: string, rating?: number, feedback?: string): Promise<HelpRequest | undefined> { return undefined; }
  async cancelHelpRequest(requestId: string): Promise<HelpRequest | undefined> { return undefined; }
  async getUserHelpRequests(userId: string): Promise<HelpRequest[]> { return []; }
  async getUserHelperRequests(helperId: string): Promise<HelpRequest[]> { return []; }
  
  async getUserPoints(userId: string): Promise<number> { return 0; }
  async addPoints(userId: string, points: number, reason: string, relatedId?: string, relatedType?: string): Promise<void> { }
  async deductPoints(userId: string, points: number, reason: string, relatedId?: string, relatedType?: string): Promise<void> { }
  async getPointTransactions(userId: string): Promise<PointTransaction[]> { return []; }
  async updateUserStreak(userId: string): Promise<void> { }
  async getTopUsers(limit?: number): Promise<User[]> { return []; }
  
  async getDailyMissions(category?: string): Promise<DailyMission[]> { return []; }
  async getUserDailyMissions(userId: string, date: string): Promise<UserMission[]> { return []; }
  async updateMissionProgress(userId: string, missionId: string, increment?: number): Promise<UserMission | undefined> { return undefined; }
  async completeMission(userId: string, missionId: string): Promise<UserMission | undefined> { return undefined; }
  async initializeDailyMissions(): Promise<void> { }
  async resetDailyMissions(userId: string, date: string): Promise<void> { }
  
  async getReminders(userId: string): Promise<Reminder[]> { return []; }
  async createReminder(reminder: InsertReminder): Promise<Reminder> { 
    throw new Error('Reminders require database storage'); 
  }
  async markReminderComplete(reminderId: string): Promise<void> { }
  async getDueReminders(): Promise<Reminder[]> { return []; }
  async deleteReminder(reminderId: string): Promise<void> { }
  
  async getCustomerTags(userId: string): Promise<CustomerTag[]> { return []; }
  async getContactTag(userId: string, contactId: string): Promise<CustomerTag | undefined> { return undefined; }
  async setCustomerTag(tag: InsertCustomerTag): Promise<CustomerTag> { 
    throw new Error('CustomerTags require database storage'); 
  }
  async updateCustomerTag(tagId: string, updates: Partial<InsertCustomerTag>): Promise<CustomerTag | undefined> { return undefined; }
  async deleteCustomerTag(tagId: string): Promise<void> { }
  
  async getQuickReplies(userId: string, category?: string): Promise<QuickReply[]> { return []; }
  async createQuickReply(reply: InsertQuickReply): Promise<QuickReply> { 
    throw new Error('QuickReplies require database storage'); 
  }
  async updateQuickReply(replyId: string, updates: Partial<InsertQuickReply>): Promise<QuickReply | undefined> { return undefined; }
  async incrementQuickReplyUsage(replyId: string): Promise<void> { }
  async deleteQuickReply(replyId: string): Promise<void> { }
  
  // Admin dashboard stats for MemStorage (placeholder)
  async getAdminDashboardStats(): Promise<any> {
    return {
      pendingVerificationRequests: 0,
      totalVerificationRequests: 0,
      totalUsers: this.users.size,
      totalStores: 0,
      todayRequests: 0,
      totalRevenue: 0
    };
  }
}

// Initialize storage with proper error handling - prioritize database storage
async function initializeStorage(): Promise<IStorage> {
  if (process.env.DATABASE_URL) {
    try {
      const dbModule = await import('./db');
      if (dbModule.db) {
        console.log('✅ Using database storage - data will be persistent across restarts');
        return new DatabaseStorage();
      }
    } catch (error) {
      console.warn('⚠️ Database connection failed, falling back to memory storage:', error);
    }
  }
  
  console.log('ℹ️ No database found - using clean in-memory storage (data will be lost on restart)');
  return new MemStorage();
}

// Initialize storage instance
const storage = await (async () => {
  try {
    const storageInstance = await initializeStorage();
    console.log('✅ Storage successfully initialized');
    return storageInstance;
  } catch (error) {
    console.warn('⚠️ Failed to initialize storage, using memory fallback:', error);
    return new MemStorage();
  }
})();

export { storage };