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
import { adminCredentials, appFeatures, users, sessions, chats, messages, otpCodes, stories, storyLikes, storyComments, stores, verificationRequests, cartItems, stickers, products } from '@shared/schema';
import { sql } from 'drizzle-orm';
import { eq, and } from 'drizzle-orm';

// Database connection will be imported conditionally when needed
let db: any = null;

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined>;
  updateUserOnlineStatus(id: string, isOnline: boolean): Promise<void>;
  deleteUser(id: string): Promise<boolean>;
  
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
  getStore(storeId: string): Promise<Store | undefined>;
  getUserStore(userId: string): Promise<Store | undefined>;
  createStore(store: InsertStore): Promise<Store>;
  updateStore(storeId: string, updates: Partial<InsertStore>): Promise<Store | undefined>;
  updateStoreStatus(storeId: string, status: string, reviewedBy: string, rejectionReason?: string): Promise<Store | undefined>;
  getStoreProducts(storeId: string): Promise<Product[]>;
  getUserProducts(userId: string): Promise<Product[]>;
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

  async getUserById(id: string): Promise<User | undefined> {
    return this.getUser(id);
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

  // Stickers implementation for MemStorage
  async getAllStickers(): Promise<any[]> {
    return [];
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