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
  type InsertAppFeature
} from "@shared/schema";
import { randomUUID } from "crypto";
import { adminCredentials, appFeatures, users, sessions, chats, messages, otpCodes, stories, storyLikes, storyComments, stores, verificationRequests } from '@shared/schema';
import { sql } from 'drizzle-orm';
import { eq, and } from 'drizzle-orm';

// Database connection will be imported conditionally when needed
let db: any = null;

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined>;
  updateUserOnlineStatus(id: string, isOnline: boolean): Promise<void>;
  
  // Authentication
  createOtpCode(otp: InsertOtp): Promise<OtpCode>;
  verifyOtpCode(phoneNumber: string, code: string): Promise<boolean>;
  createSession(session: InsertSession): Promise<Session>;
  getSessionByToken(token: string): Promise<Session | undefined>;
  deleteSession(token: string): Promise<void>;
  
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
  
  // Admin Features
  getAdminCredentials(): Promise<AdminCredentials | undefined>;
  updateAdminCredentials(credentials: InsertAdminCredentials): Promise<AdminCredentials>;
  getAllFeatures(): Promise<AppFeature[]>;
  getFeature(featureId: string): Promise<AppFeature | undefined>;
  updateFeature(featureId: string, updates: Partial<InsertAppFeature>): Promise<AppFeature | undefined>;
  initializeDefaultFeatures(): Promise<void>;
  
  // Admin management methods
  getAllUsers(): Promise<User[]>;
  updateUserAdminStatus(userId: string, isAdmin: boolean): Promise<User | undefined>;
  updateUserVerificationStatus(userId: string, isVerified: boolean): Promise<User | undefined>;
}

// Database Storage Implementation - uses PostgreSQL database
export class DatabaseStorage implements IStorage {
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

  async getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber)).limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting user by phone:', error);
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

  async verifyOtpCode(phoneNumber: string, code: string): Promise<boolean> {
    try {
      if (!db) {
        const dbModule = await import('./db');
        db = dbModule.db;
      }
      
      const result = await db.select().from(otpCodes)
        .where(and(
          eq(otpCodes.phoneNumber, phoneNumber),
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
        { id: "affiliate", name: "التسويق بالعمولة", description: "كسب المال من خلال التسويق", isEnabled: true, category: "marketplace", priority: 5 },
        { id: "verification", name: "التوثيق", description: "توثيق الحسابات والمتاجر", isEnabled: true, category: "admin", priority: 6 },
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

  constructor() {
    // Initialize only default features - NO MOCK DATA
    this.initializeDefaultFeatures();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
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

  async verifyOtpCode(phoneNumber: string, code: string): Promise<boolean> {
    const otpRecord = Array.from(this.otpCodes.values()).find(
      otp => otp.phoneNumber === phoneNumber && otp.code === code && !otp.isUsed
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
      { id: "affiliate", name: "التسويق بالعمولة", description: "كسب المال من خلال التسويق", isEnabled: true, category: "marketplace", priority: 5, createdAt: new Date(), updatedAt: new Date() },
      { id: "verification", name: "التوثيق", description: "توثيق الحسابات والمتاجر", isEnabled: true, category: "admin", priority: 6, createdAt: new Date(), updatedAt: new Date() },
    ];

    defaultFeatures.forEach(feature => {
      if (!this.features.has(feature.id)) {
        this.features.set(feature.id, feature);
      }
    });
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