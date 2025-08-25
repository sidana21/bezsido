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
import { db } from './db';
import { adminCredentials, appFeatures } from '@shared/schema';
import { eq } from 'drizzle-orm';

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
  
  // Stores
  getStores(location?: string, category?: string): Promise<(Store & { owner: User })[]>;
  getStore(id: string): Promise<Store | undefined>;
  getUserStore(userId: string): Promise<Store | undefined>;
  createStore(store: InsertStore): Promise<Store>;
  updateStore(id: string, store: Partial<InsertStore>): Promise<Store | undefined>;
  deleteStore(id: string): Promise<boolean>;

  // Products
  getProducts(location?: string, category?: string): Promise<(Product & { owner: User })[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getUserProducts(userId: string): Promise<Product[]>;
  getStoreProducts(storeId: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  
  // Affiliate Links
  createAffiliateLink(affiliateLink: InsertAffiliateLink): Promise<AffiliateLink>;
  getAffiliateLink(uniqueCode: string): Promise<AffiliateLink | undefined>;
  getUserAffiliateLinks(userId: string): Promise<(AffiliateLink & { product: Product })[]>;
  trackClick(uniqueCode: string): Promise<void>;
  trackConversion(uniqueCode: string, buyerId: string, amount: string): Promise<Commission>;
  
  // Commissions
  getUserCommissions(userId: string): Promise<(Commission & { affiliateLink: AffiliateLink & { product: Product } })[]>;
  getTotalCommissions(userId: string): Promise<string>;
  getCommissionsByStatus(userId: string, status: string): Promise<Commission[]>;
  
  // Contacts
  getUserContacts(userId: string): Promise<(Contact & { user?: User })[]>;
  addContact(contact: InsertContact): Promise<Contact>;
  searchUserByPhoneNumber(phoneNumber: string): Promise<User | undefined>;
  updateContactAppUser(contactId: string, contactUserId: string): Promise<void>;

  // Shopping Cart
  getCartItems(userId: string): Promise<(CartItem & { product: Product & { owner: User } })[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItemQuantity(userId: string, productId: string, quantity: string): Promise<void>;
  removeFromCart(userId: string, productId: string): Promise<void>;
  clearCart(userId: string): Promise<void>;
  
  // Orders
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  getUserOrders(userId: string): Promise<(Order & { items: (OrderItem & { product: Product })[], seller: User })[]>;
  getSellerOrders(sellerId: string): Promise<(Order & { items: (OrderItem & { product: Product })[], buyer: User })[]>;
  getOrder(orderId: string): Promise<(Order & { items: (OrderItem & { product: Product })[], seller: User, buyer: User }) | undefined>;
  updateOrderStatus(orderId: string, status: string, updatedBy: string): Promise<Order | undefined>;
  cancelOrder(orderId: string, reason: string): Promise<Order | undefined>;
  
  // Verification Requests
  createVerificationRequest(request: InsertVerificationRequest): Promise<VerificationRequest>;
  getUserVerificationRequests(userId: string): Promise<VerificationRequest[]>;
  getVerificationRequest(id: string): Promise<VerificationRequest | undefined>;
  updateVerificationRequestStatus(id: string, status: string, adminNote?: string, reviewedBy?: string): Promise<VerificationRequest | undefined>;

  // Story Likes
  likeStory(storyId: string, userId: string, reactionType?: string): Promise<StoryLike>;
  unlikeStory(storyId: string, userId: string): Promise<void>;
  getStoryLikes(storyId: string): Promise<(StoryLike & { user: User })[]>;
  getStoryLikeCount(storyId: string): Promise<number>;
  hasUserLikedStory(storyId: string, userId: string): Promise<boolean>;
  
  // Story Comments
  addStoryComment(comment: InsertStoryComment): Promise<StoryComment>;
  getStoryComments(storyId: string): Promise<(StoryComment & { user: User })[]>;
  updateStoryComment(commentId: string, content: string): Promise<StoryComment | undefined>;
  deleteStoryComment(commentId: string): Promise<void>;
  getStoryCommentCount(storyId: string): Promise<number>;

  // Stickers
  getAllStickers(): Promise<Sticker[]>;
  getStickersByCategory(category: string): Promise<Sticker[]>;
  getSticker(id: string): Promise<Sticker | undefined>;
  createSticker(sticker: InsertSticker): Promise<Sticker>;

  // Admin Functions
  getUserById(id: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getAllVerificationRequests(status?: string): Promise<VerificationRequest[]>;
  updateUserAdminStatus(userId: string, isAdmin: boolean): Promise<User | undefined>;
  updateUserVerificationStatus(userId: string, isVerified: boolean): Promise<User | undefined>;
  getAllStores(): Promise<Store[]>;
  updateStoreStatus(storeId: string, status: string): Promise<Store | undefined>;
  getAllOrders(): Promise<Order[]>;
  getAdminDashboardStats(): Promise<{
    totalUsers: number;
    totalStores: number;
    totalOrders: number;
    pendingVerifications: number;
    recentOrders: number;
    totalRevenue: string;
    activeUsers: number;
    verifiedUsers: number;
  }>;
  
  // Admin Credentials
  getAdminCredentials(): Promise<AdminCredentials | undefined>;
  updateAdminCredentials(credentials: InsertAdminCredentials): Promise<AdminCredentials>;
  
  // Feature Management
  getAllFeatures(): Promise<AppFeature[]>;
  getFeature(featureId: string): Promise<AppFeature | undefined>;
  updateFeature(featureId: string, updates: Partial<InsertAppFeature>): Promise<AppFeature | undefined>;
  initializeDefaultFeatures(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private chats: Map<string, Chat>;
  private messages: Map<string, Message>;
  private stories: Map<string, Story>;
  private sessions: Map<string, Session>;
  private otpCodes: Map<string, OtpCode>;
  private stores: Map<string, Store>;
  private products: Map<string, Product>;
  private affiliateLinks: Map<string, AffiliateLink>;
  private commissions: Map<string, Commission>;
  private contacts: Map<string, Contact>;
  private cartItems: Map<string, CartItem>;
  private orders: Map<string, Order>;
  private orderItems: Map<string, OrderItem>;
  private verificationRequests: Map<string, VerificationRequest>;
  private storyLikes: Map<string, StoryLike>;
  private storyComments: Map<string, StoryComment>;
  private stickers: Map<string, Sticker>;
  private adminCredentials: AdminCredentials | undefined;
  private features: Map<string, AppFeature>;

  constructor() {
    this.users = new Map();
    this.chats = new Map();
    this.messages = new Map();
    this.stories = new Map();
    this.sessions = new Map();
    this.otpCodes = new Map();
    this.stores = new Map();
    this.products = new Map();
    this.affiliateLinks = new Map();
    this.commissions = new Map();
    this.contacts = new Map();
    this.cartItems = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.verificationRequests = new Map();
    this.storyLikes = new Map();
    this.storyComments = new Map();
    this.stickers = new Map();
    this.features = new Map();
    this.initializeMockData();
    this.initializeTestSession();
    this.initializeMockComments();
    this.initializeDefaultFeatures();
  }

  private initializeTestSession() {
    // Create a test session for development
    const testSession: Session = {
      id: "test-session-123",
      userId: "current-user",
      token: "test-token-123",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      createdAt: new Date()
    };
    this.sessions.set(testSession.token, testSession);
  }

  private initializeMockComments() {
    // Add some mock comments to demonstrate the feature
    const mockComments: StoryComment[] = [
      {
        id: "comment-1",
        storyId: "story-sarah-1",
        userId: "current-user",
        content: "صورة رائعة! 😍",
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        updatedAt: new Date(Date.now() - 3600000),
      },
      {
        id: "comment-2", 
        storyId: "story-sarah-1",
        userId: "ahmed-user",
        content: "مناظر جميلة جداً 🌟",
        createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
        updatedAt: new Date(Date.now() - 1800000),
      },
      {
        id: "comment-3",
        storyId: "story-fatima-1", 
        userId: "sarah-user",
        content: "نعم يوم جميل فعلاً ☀️",
        createdAt: new Date(Date.now() - 900000), // 15 minutes ago
        updatedAt: new Date(Date.now() - 900000),
      }
    ];

    mockComments.forEach(comment => {
      this.storyComments.set(comment.id, comment);
    });
  }

  private initializeMockData() {
    // Create mock users
    const currentUser: User = {
      id: "current-user",
      phoneNumber: "+213555123456",
      name: "أنا",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
      location: "تندوف",
      isOnline: true,
      isVerified: true,
      verifiedAt: new Date(),
      isAdmin: true, // Make current user admin
      lastSeen: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const sarahUser: User = {
      id: "sarah-user",
      phoneNumber: "+213555234567",
      name: "سارة أحمد",
      avatar: "https://pixabay.com/get/g5ede2eab7ebacb14e91863d35be3f093549755f13131724e5e19c6a49a45921c44adc3a540b01f28abed2c4568cf8e907881a83c9d0679b2c22c054985afc7d2_1280.jpg",
      location: "تندوف",
      isOnline: true,
      isVerified: true, // Made verified for testing
      verifiedAt: new Date(Date.now() - 43200000), // 12 hours ago
      isAdmin: false,
      lastSeen: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const ahmedUser: User = {
      id: "ahmed-user",
      phoneNumber: "+213555345678",
      name: "أحمد محمد",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
      location: "وهران",
      isOnline: false,
      isVerified: true,
      verifiedAt: new Date(Date.now() - 86400000),
      isAdmin: false,
      lastSeen: new Date(Date.now() - 86400000), // 1 day ago
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const fatimaUser: User = {
      id: "fatima-user",
      phoneNumber: "+213555456789",
      name: "فاطمة علي",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
      location: "تندوف",
      isOnline: true,
      isVerified: false,
      verifiedAt: null,
      isAdmin: false,
      lastSeen: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mariamUser: User = {
      id: "mariam-user",
      phoneNumber: "+213555567890",
      name: "مريم حسن",
      avatar: "https://images.unsplash.com/photo-1589156191108-c762ff4b96ab?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
      location: "قسنطينة",
      isOnline: true,
      isVerified: true,
      verifiedAt: new Date(Date.now() - 172800000),
      isAdmin: false,
      lastSeen: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const yousefUser: User = {
      id: "yousef-user",
      phoneNumber: "+213555678901",
      name: "يوسف إبراهيم",
      avatar: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
      location: "عنابة",
      isOnline: false,
      isVerified: false,
      verifiedAt: null,
      isAdmin: false,
      lastSeen: new Date(Date.now() - 172800000), // 2 days ago
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const abdullahUser: User = {
      id: "abdullah-user",
      phoneNumber: "+213555789012",
      name: "عبدالله خالد",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
      location: "سطيف",
      isOnline: false,
      isVerified: false,
      verifiedAt: null,
      isAdmin: false,
      lastSeen: new Date(Date.now() - 259200000), // 3 days ago
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const lailaUser: User = {
      id: "laila-user",
      phoneNumber: "+213555890123",
      name: "ليلى أحمد",
      avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
      location: "باتنة",
      isOnline: false,
      isVerified: false,
      verifiedAt: null,
      isAdmin: false,
      lastSeen: new Date(Date.now() - 345600000), // 4 days ago
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store owners for messaging functionality
    const storeOwner1: User = {
      id: "user-store-1",
      phoneNumber: "+213555123456",
      name: "صاحب متجر الإلكترونيات",
      avatar: "https://i.pravatar.cc/150?img=11",
      location: "تندوف",
      isOnline: true,
      isVerified: true,
      verifiedAt: new Date(Date.now() - 604800000), // 7 days ago
      isAdmin: false,
      lastSeen: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const storeOwner2: User = {
      id: "user-store-2",
      phoneNumber: "+213555789123",
      name: "صاحب بقالة العائلة",
      avatar: "https://i.pravatar.cc/150?img=12",
      location: "تندوف",
      isOnline: false,
      isVerified: false,
      verifiedAt: null,
      isAdmin: false,
      lastSeen: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const storeOwner3: User = {
      id: "user-store-3",
      phoneNumber: "+213555456789",
      name: "صاحب مخبز الأصالة",
      avatar: "https://i.pravatar.cc/150?img=13",
      location: "تندوف",
      isOnline: false,
      isVerified: true,
      verifiedAt: new Date(Date.now() - 1209600000), // 14 days ago
      isAdmin: false,
      lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    [currentUser, sarahUser, ahmedUser, fatimaUser, mariamUser, yousefUser, abdullahUser, lailaUser, storeOwner1, storeOwner2, storeOwner3].forEach(user => {
      this.users.set(user.id, user);
    });

    // Create mock chats
    const sarahChat: Chat = {
      id: "chat-sarah",
      name: null,
      isGroup: false,
      avatar: null,
      participants: ["current-user", "sarah-user"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const ahmedChat: Chat = {
      id: "chat-ahmed",
      name: null,
      isGroup: false,
      avatar: null,
      participants: ["current-user", "ahmed-user"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const groupChat: Chat = {
      id: "chat-group",
      name: "مجموعة الأصدقاء",
      isGroup: true,
      avatar: "https://images.unsplash.com/photo-1529111290557-82f6d5c6cf85?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
      participants: ["current-user", "sarah-user", "ahmed-user", "fatima-user"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const fatimaChat: Chat = {
      id: "chat-fatima",
      name: null,
      isGroup: false,
      avatar: null,
      participants: ["current-user", "fatima-user"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    [sarahChat, ahmedChat, groupChat, fatimaChat].forEach(chat => {
      this.chats.set(chat.id, chat);
    });

    // Create mock messages for Sarah's chat
    const sarahMessages: Message[] = [
      {
        id: "msg-1",
        chatId: "chat-sarah",
        senderId: "sarah-user",
        content: "أهلاً! كيف حالك؟ 😊",
        messageType: "text",
        imageUrl: null,
        audioUrl: null,
        stickerUrl: null,
        stickerId: null,
        locationLat: null,
        locationLon: null,
        locationName: null,
        replyToMessageId: null,
        timestamp: new Date(Date.now() - 1800000), // 30 min ago
        isRead: true,
        isDelivered: true,
        isEdited: false,
        editedAt: null,
        deletedAt: null,
      },
      {
        id: "msg-2",
        chatId: "chat-sarah",
        senderId: "current-user",
        content: "الحمد لله بخير! وأنت كيف حالك؟",
        messageType: "text",
        imageUrl: null,
        audioUrl: null,
        stickerUrl: null,
        stickerId: null,
        locationLat: null,
        locationLon: null,
        locationName: null,
        replyToMessageId: null,
        timestamp: new Date(Date.now() - 1740000), // 29 min ago
        isRead: true,
        isDelivered: true,
        isEdited: false,
        editedAt: null,
        deletedAt: null,
      },
      {
        id: "msg-3",
        chatId: "chat-sarah",
        senderId: "sarah-user",
        content: "شاهد هذا المنظر الرائع!",
        messageType: "image",
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300",
        audioUrl: null,
        stickerUrl: null,
        stickerId: null,
        locationLat: null,
        locationLon: null,
        locationName: null,
        replyToMessageId: null,
        timestamp: new Date(Date.now() - 1500000), // 25 min ago
        isRead: true,
        isDelivered: true,
        isEdited: false,
        editedAt: null,
        deletedAt: null,
      },
      {
        id: "msg-4",
        chatId: "chat-sarah",
        senderId: "current-user",
        content: "واو! 😍 منظر خلاب فعلاً. أين هذا المكان؟",
        messageType: "text",
        imageUrl: null,
        audioUrl: null,
        stickerUrl: null,
        stickerId: null,
        locationLat: null,
        locationLon: null,
        locationName: null,
        replyToMessageId: null,
        timestamp: new Date(Date.now() - 1440000), // 24 min ago
        isRead: true,
        isDelivered: true,
        isEdited: false,
        editedAt: null,
        deletedAt: null,
      },
      {
        id: "msg-5",
        chatId: "chat-sarah",
        senderId: "sarah-user",
        content: "هذا في جبال الألب السويسرية 🏔️",
        messageType: "text",
        imageUrl: null,
        audioUrl: null,
        stickerUrl: null,
        stickerId: null,
        locationLat: null,
        locationLon: null,
        locationName: null,
        replyToMessageId: null,
        timestamp: new Date(Date.now() - 1380000), // 23 min ago
        isRead: true,
        isDelivered: true,
        isEdited: false,
        editedAt: null,
        deletedAt: null,
      },
      {
        id: "msg-6",
        chatId: "chat-sarah",
        senderId: "sarah-user",
        content: "وهذا الغداء الذي تناولته هناك 🍽️",
        messageType: "image",
        imageUrl: "https://pixabay.com/get/gea1be77aa5dcbc2d39439c59e6b5feac148a0dfca36adf924c39583adb8620c2dc7693eb1b91ae3403b59786254a797ddd8c179d871743545cf7ddeb15b970ef_1280.jpg",
        audioUrl: null,
        stickerUrl: null,
        stickerId: null,
        locationLat: null,
        locationLon: null,
        locationName: null,
        replyToMessageId: null,
        timestamp: new Date(Date.now() - 1320000), // 22 min ago
        isRead: true,
        isDelivered: true,
        isEdited: false,
        editedAt: null,
        deletedAt: null,
      },
      {
        id: "msg-7",
        chatId: "chat-sarah",
        senderId: "current-user",
        content: "يبدو لذيذاً جداً! 🤤 متى ستعودين؟",
        messageType: "text",
        imageUrl: null,
        audioUrl: null,
        stickerUrl: null,
        stickerId: null,
        locationLat: null,
        locationLon: null,
        locationName: null,
        replyToMessageId: null,
        timestamp: new Date(Date.now() - 1200000), // 20 min ago
        isRead: true,
        isDelivered: true,
        isEdited: false,
        editedAt: null,
        deletedAt: null,
      },
      {
        id: "msg-8",
        chatId: "chat-sarah",
        senderId: "sarah-user",
        content: "سأعود الأسبوع القادم إن شاء الله",
        messageType: "image",
        imageUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300",
        audioUrl: null,
        stickerUrl: null,
        stickerId: null,
        locationLat: null,
        locationLon: null,
        locationName: null,
        replyToMessageId: null,
        timestamp: new Date(Date.now() - 1140000), // 19 min ago
        isRead: true,
        isDelivered: true,
        isEdited: false,
        editedAt: null,
        deletedAt: null,
      },
      {
        id: "msg-9",
        chatId: "chat-sarah",
        senderId: "current-user",
        content: "بالمناسبة، هل تتذكرين هذا المكان؟ 🌲",
        messageType: "image",
        imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300",
        audioUrl: null,
        stickerUrl: null,
        stickerId: null,
        locationLat: null,
        locationLon: null,
        locationName: null,
        replyToMessageId: null,
        timestamp: new Date(Date.now() - 1020000), // 17 min ago
        isRead: true,
        isDelivered: true,
        isEdited: false,
        editedAt: null,
        deletedAt: null,
      },
      {
        id: "msg-10",
        chatId: "chat-sarah",
        senderId: "sarah-user",
        content: "أجل! المقهى الذي كنا نذهب إليه ☕",
        messageType: "image",
        imageUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300",
        audioUrl: null,
        stickerUrl: null,
        stickerId: null,
        locationLat: null,
        locationLon: null,
        locationName: null,
        replyToMessageId: null,
        timestamp: new Date(Date.now() - 960000), // 16 min ago
        isRead: true,
        isDelivered: true,
        isEdited: false,
        editedAt: null,
        deletedAt: null,
      },
      {
        id: "msg-11",
        chatId: "chat-sarah",
        senderId: "current-user",
        content: "نعم! ذكريات جميلة 😊 سأنتظر عودتك",
        messageType: "text",
        imageUrl: null,
        audioUrl: null,
        stickerUrl: null,
        stickerId: null,
        locationLat: null,
        locationLon: null,
        locationName: null,
        replyToMessageId: null,
        timestamp: new Date(Date.now() - 900000), // 15 min ago
        isRead: false,
        isDelivered: true,
        isEdited: false,
        editedAt: null,
        deletedAt: null,
      },
    ];

    sarahMessages.forEach(message => {
      this.messages.set(message.id, message);
    });

    // Create mock stories
    const mockStories: Story[] = [
      {
        id: "story-sarah-1",
        userId: "sarah-user",
        location: "تندوف",
        content: "في رحلة جميلة 🌟",
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=600",
        videoUrl: null,
        backgroundColor: "#075e54",
        textColor: "#ffffff",
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        expiresAt: new Date(Date.now() + 82800000), // expires in 23 hours
        viewCount: "5",
        viewers: ["current-user", "ahmed-user"],
      },
      {
        id: "story-fatima-1",
        userId: "fatima-user",
        location: "تندوف",
        content: "يوم رائع! ☀️",
        imageUrl: null,
        videoUrl: null,
        backgroundColor: "#25D366",
        textColor: "#ffffff",
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        expiresAt: new Date(Date.now() + 79200000), // expires in 22 hours
        viewCount: "12",
        viewers: ["current-user"],
      },
      {
        id: "story-mariam-1",
        userId: "mariam-user",
        location: "الجزائر",
        content: null,
        imageUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=600",
        videoUrl: null,
        backgroundColor: "#075e54",
        textColor: "#ffffff",
        timestamp: new Date(Date.now() - 10800000), // 3 hours ago
        expiresAt: new Date(Date.now() + 75600000), // expires in 21 hours
        viewCount: "8",
        viewers: ["current-user", "sarah-user", "ahmed-user"],
      }
    ];

    mockStories.forEach(story => {
      this.stories.set(story.id, story);
    });

    // Create mock products for affiliate marketing
    const mockProducts: Product[] = [
      {
        id: "product-1",
        userId: "user-store-1", // Electronics store owner
        storeId: "store-1",
        name: "سماعة بلوتوث لاسلكية",
        description: "سماعة عالية الجودة مع تقنية إلغاء الضوضاء وبطارية تدوم 24 ساعة",
        price: "15000",
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        category: "إلكترونيات",
        location: "تندوف",
        isActive: true,
        commissionRate: "0.08", // 8% commission
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "product-2", 
        userId: "user-store-1",
        storeId: "store-1",
        name: "شاحن سريع للهاتف",
        description: "شاحن سريع 65W متوافق مع جميع الهواتف الذكية",
        price: "3500",
        imageUrl: "https://images.unsplash.com/photo-1583394838336-acd977736f90?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        category: "إلكترونيات",
        location: "تندوف",
        isActive: true,
        commissionRate: "0.10", // 10% commission
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "product-3",
        userId: "user-store-2", // Grocery store owner
        storeId: "store-2",
        name: "عسل طبيعي صحراوي",
        description: "عسل طبيعي 100% من الصحراء الجزائرية، غني بالفوائد الطبية",
        price: "2500",
        imageUrl: "https://images.unsplash.com/photo-1587049332474-964043d9ce5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        category: "أغذية طبيعية",
        location: "تندوف",
        isActive: true,
        commissionRate: "0.12", // 12% commission
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "product-4",
        userId: "user-store-3", // Bakery owner
        storeId: "store-3",
        name: "خبز تندوف التقليدي",
        description: "خبز طازج يومياً من الفرن التقليدي بوصفة محلية أصيلة",
        price: "150",
        imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        category: "مخبوزات",
        location: "تندوف",
        isActive: true,
        commissionRate: "0.15", // 15% commission
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "product-5",
        userId: "sarah-user", // Regular user selling
        storeId: null,
        name: "حقيبة يد نسائية",
        description: "حقيبة أنيقة مصنوعة من الجلد الطبيعي، مناسبة لجميع المناسبات",
        price: "8500",
        imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        category: "أزياء وإكسسوار",
        location: "تندوف",
        isActive: true,
        commissionRate: "0.06", // 6% commission
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    mockProducts.forEach(product => {
      this.products.set(product.id, product);
    });

    // Create some sample affiliate links
    const mockAffiliateLinks: AffiliateLink[] = [
      {
        id: "aff-1",
        productId: "product-1",
        affiliateId: "current-user",
        uniqueCode: "AFF001HEADPHONES",
        clicks: "15",
        conversions: "3",
        totalCommission: "3600", // 15000 * 0.08 * 3
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
      },
      {
        id: "aff-2",
        productId: "product-3",
        affiliateId: "current-user", 
        uniqueCode: "AFF002HONEY",
        clicks: "8",
        conversions: "2",
        totalCommission: "600", // 2500 * 0.12 * 2
        createdAt: new Date(Date.now() - 172800000), // 2 days ago
      }
    ];

    mockAffiliateLinks.forEach(link => {
      this.affiliateLinks.set(link.id, link);
    });

    // Create some sample commissions
    const mockCommissions: Commission[] = [
      {
        id: "comm-1",
        affiliateLinkId: "aff-1",
        buyerId: "sarah-user",
        amount: "1200", // 15000 * 0.08
        status: "paid",
        transactionId: "txn-001",
        createdAt: new Date(Date.now() - 86400000),
        paidAt: new Date(Date.now() - 43200000), // paid 12 hours ago
      },
      {
        id: "comm-2",
        affiliateLinkId: "aff-1", 
        buyerId: "ahmed-user",
        amount: "1200",
        status: "pending",
        transactionId: "txn-002",
        createdAt: new Date(Date.now() - 21600000), // 6 hours ago
        paidAt: null,
      },
      {
        id: "comm-3",
        affiliateLinkId: "aff-2",
        buyerId: "fatima-user", 
        amount: "300", // 2500 * 0.12
        status: "paid",
        transactionId: "txn-003",
        createdAt: new Date(Date.now() - 172800000),
        paidAt: new Date(Date.now() - 86400000),
      }
    ];

    mockCommissions.forEach(commission => {
      this.commissions.set(commission.id, commission);
    });

    // Create mock contacts
    const mockContacts: Contact[] = [
      {
        id: "contact-1",
        userId: "current-user",
        contactUserId: "sarah-user",
        phoneNumber: "+213555234567",
        name: "سارة أحمد",
        isAppUser: true,
        createdAt: new Date(),
      },
      {
        id: "contact-2", 
        userId: "current-user",
        contactUserId: "ahmed-user",
        phoneNumber: "+213555345678",
        name: "أحمد محمد",
        isAppUser: true,
        createdAt: new Date(),
      },
      {
        id: "contact-3",
        userId: "current-user",
        contactUserId: "fatima-user",
        phoneNumber: "+213555456789",
        name: "فاطمة علي",
        isAppUser: true,
        createdAt: new Date(),
      },
      {
        id: "contact-4",
        userId: "current-user",
        contactUserId: null,
        phoneNumber: "+213555123999",
        name: "خالد حسن",
        isAppUser: false,
        createdAt: new Date(),
      },
      {
        id: "contact-5",
        userId: "current-user", 
        contactUserId: null,
        phoneNumber: "+213555887766",
        name: "نور الدين",
        isAppUser: false,
        createdAt: new Date(),
      },
      {
        id: "contact-6",
        userId: "current-user",
        contactUserId: "mariam-user",
        phoneNumber: "+213555567890",
        name: "مريم حسن",
        isAppUser: true,
        createdAt: new Date(),
      }
    ];

    mockContacts.forEach(contact => {
      this.contacts.set(contact.id, contact);
    });

    // Add more users for variety
    const additionalUsers: User[] = [
      {
        id: "khalil-user",
        phoneNumber: "+213555111222",
        name: "خليل بن عمر",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        location: "تندوف",
        isOnline: true,
        isVerified: true,
        verifiedAt: new Date(Date.now() - 345600000),
        isAdmin: false,
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "amina-user",
        phoneNumber: "+213555333444",
        name: "أمينة محمود",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        location: "وهران",
        isOnline: false,
        isVerified: false,
        verifiedAt: null,
        isAdmin: false,
        lastSeen: new Date(Date.now() - 3600000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "rashid-user",
        phoneNumber: "+213555555666",
        name: "رشيد العلي",
        avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        location: "الجزائر",
        isOnline: true,
        isVerified: true,
        verifiedAt: new Date(Date.now() - 604800000),
        isAdmin: false,
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "nadia-user",
        phoneNumber: "+213555777888",
        name: "نادية سلام",
        avatar: "https://images.unsplash.com/photo-1589156191108-c762ff4b96ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        location: "قسنطينة",
        isOnline: false,
        isVerified: true,
        verifiedAt: new Date(Date.now() - 172800000),
        isAdmin: false,
        lastSeen: new Date(Date.now() - 1800000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "omar-user",
        phoneNumber: "+213555999000",
        name: "عمر حسين",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        location: "تندوف",
        isOnline: true,
        isVerified: false,
        verifiedAt: null,
        isAdmin: false,
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    additionalUsers.forEach(user => {
      this.users.set(user.id, user);
    });

    // Create mock stores
    const mockStores: Store[] = [
      {
        id: "store-1",
        userId: "user-store-1",
        name: "متجر الإلكترونيات المتقدمة",
        description: "متجر متخصص في بيع أحدث الأجهزة الإلكترونية والهواتف الذكية وإكسسواراتها",
        imageUrl: "https://images.unsplash.com/photo-1560472355-536de3962603?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
        category: "إلكترونيات",
        location: "تندوف",
        phoneNumber: "+213555123456",
        isOpen: true,
        isActive: true,
        status: "approved",
        isVerified: true,
        verifiedAt: new Date(Date.now() - 604800000),
        approvedAt: new Date(Date.now() - 604800000),
        approvedBy: "admin-user",
        rejectionReason: null,
        createdAt: new Date(Date.now() - 2592000000),
        updatedAt: new Date(),
      },
      {
        id: "store-2",
        userId: "user-store-2",
        name: "بقالة العائلة الكبرى",
        description: "بقالة شاملة تقدم جميع المنتجات الغذائية والمنزلية بأسعار مناسبة",
        imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
        category: "مواد غذائية",
        location: "تندوف",
        phoneNumber: "+213555789123",
        isOpen: true,
        isActive: false,
        status: "pending",
        isVerified: false,
        verifiedAt: null,
        approvedAt: null,
        approvedBy: null,
        rejectionReason: null,
        createdAt: new Date(Date.now() - 1296000000),
        updatedAt: new Date(),
      },
      {
        id: "store-3",
        userId: "user-store-3",
        name: "مخبز الأصالة",
        description: "مخبز تقليدي ينتج الخبز والمعجنات الطازجة يومياً بوصفات محلية أصيلة",
        imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
        category: "مخبوزات",
        location: "تندوف",
        phoneNumber: "+213555456789",
        isOpen: true,
        isActive: true,
        status: "approved",
        isVerified: true,
        verifiedAt: new Date(Date.now() - 1209600000),
        approvedAt: new Date(Date.now() - 1209600000),
        approvedBy: "admin-user",
        rejectionReason: null,
        createdAt: new Date(Date.now() - 1728000000),
        updatedAt: new Date(),
      },
      {
        id: "store-4",
        userId: "khalil-user",
        name: "صيدلية النور",
        description: "صيدلية شاملة تقدم جميع الأدوية والمستحضرات الطبية والتجميلية",
        imageUrl: "https://images.unsplash.com/photo-1576602976047-174e57a47881?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
        category: "صيدلة ومستحضرات طبية",
        location: "تندوف",
        phoneNumber: "+213555111222",
        isOpen: true,
        isActive: true,
        status: "approved",
        isVerified: true,
        verifiedAt: new Date(Date.now() - 345600000),
        approvedAt: new Date(Date.now() - 345600000),
        approvedBy: "admin-user",
        rejectionReason: null,
        createdAt: new Date(Date.now() - 864000000),
        updatedAt: new Date(),
      },
      {
        id: "store-5",
        userId: "rashid-user",
        name: "ورشة السيارات المتخصصة",
        description: "ورشة تصليح وصيانة السيارات مع خدمة قطع الغيار الأصلية",
        imageUrl: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
        category: "قطع غيار وخدمات سيارات",
        location: "الجزائر",
        phoneNumber: "+213555555666",
        isOpen: false,
        isActive: true,
        status: "approved",
        isVerified: true,
        verifiedAt: new Date(Date.now() - 604800000),
        approvedAt: new Date(Date.now() - 604800000),
        approvedBy: "admin-user",
        rejectionReason: null,
        createdAt: new Date(Date.now() - 1555200000),
        updatedAt: new Date(),
      },
      {
        id: "store-6",
        userId: "nadia-user",
        name: "محل الأزياء العصرية",
        description: "متجر أزياء نسائية عصرية يقدم أحدث الموضات والإكسسوارات",
        imageUrl: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
        category: "أزياء وإكسسوار",
        location: "قسنطينة",
        phoneNumber: "+213555777888",
        isOpen: true,
        isActive: false,
        status: "pending",
        isVerified: false,
        verifiedAt: null,
        approvedAt: null,
        approvedBy: null,
        rejectionReason: null,
        createdAt: new Date(Date.now() - 2160000000),
        updatedAt: new Date(),
      },
      {
        id: "store-7",
        userId: "omar-user",
        name: "مقهى الشباب",
        description: "مقهى عصري يقدم المشروبات الساخنة والباردة والوجبات الخفيفة",
        imageUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
        category: "مطاعم ومقاهي",
        location: "تندوف",
        phoneNumber: "+213555999000",
        isOpen: true,
        isActive: true,
        status: "approved",
        isVerified: false,
        verifiedAt: null,
        approvedAt: new Date(Date.now() - 432000000),
        approvedBy: "admin-user",
        rejectionReason: null,
        createdAt: new Date(Date.now() - 432000000),
        updatedAt: new Date(),
      },
      {
        id: "store-8",
        userId: "amina-user",
        name: "مكتبة المعرفة",
        description: "مكتبة شاملة تضم الكتب والقرطاسية والمستلزمات المدرسية",
        imageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
        category: "كتب وقرطاسية",
        location: "وهران",
        phoneNumber: "+213555333444",
        isOpen: true,
        isActive: false,
        status: "pending",
        isVerified: false,
        verifiedAt: null,
        approvedAt: null,
        approvedBy: null,
        rejectionReason: null,
        createdAt: new Date(Date.now() - 1296000000),
        updatedAt: new Date(),
      }
    ];

    mockStores.forEach(store => {
      this.stores.set(store.id, store);
    });

    // Create sample verification requests
    const mockVerificationRequests: VerificationRequest[] = [
      {
        id: randomUUID(),
        userId: "fatima-user",
        storeId: null,
        requestType: "user",
        status: "pending",
        documents: [],
        reason: "أريد توثيق حسابي لأنني تاجرة معروفة في المنطقة وأبيع المنتجات اليدوية",
        adminNote: null,
        submittedAt: new Date(Date.now() - 3600000), // 1 hour ago
        reviewedAt: null,
        reviewedBy: null,
      },
      {
        id: randomUUID(),
        userId: "yousef-user",
        storeId: null,
        requestType: "user", 
        status: "pending",
        documents: [],
        reason: "لدي خبرة طويلة في التجارة وأريد الحصول على توثيق لزيادة ثقة العملاء",
        adminNote: null,
        submittedAt: new Date(Date.now() - 7200000), // 2 hours ago
        reviewedAt: null,
        reviewedBy: null,
      },
      {
        id: randomUUID(),
        userId: "abdullah-user",
        storeId: null,
        requestType: "user",
        status: "pending",
        documents: [],
        reason: "أعمل في مجال الإلكترونيات منذ 5 سنوات وأحتاج التوثيق للمصداقية",
        adminNote: null,
        submittedAt: new Date(Date.now() - 10800000), // 3 hours ago
        reviewedAt: null,
        reviewedBy: null,
      }
    ];

    mockVerificationRequests.forEach(request => {
      this.verificationRequests.set(request.id, request);
    });

    // Create default stickers
    const mockStickers: Sticker[] = [
      // General category
      {
        id: "sticker-1",
        name: "ابتسامة",
        imageUrl: "😊",
        category: "general",
        isActive: true,
        sortOrder: 1,
        createdAt: new Date(),
      },
      {
        id: "sticker-2", 
        name: "حزين",
        imageUrl: "😢",
        category: "general",
        isActive: true,
        sortOrder: 2,
        createdAt: new Date(),
      },
      {
        id: "sticker-3",
        name: "حب",
        imageUrl: "❤️",
        category: "general", 
        isActive: true,
        sortOrder: 3,
        createdAt: new Date(),
      },
      {
        id: "sticker-4",
        name: "إعجاب",
        imageUrl: "👍",
        category: "general",
        isActive: true,
        sortOrder: 4,
        createdAt: new Date(),
      },
      {
        id: "sticker-5",
        name: "ضحك",
        imageUrl: "😂",
        category: "general",
        isActive: true,
        sortOrder: 5,
        createdAt: new Date(),
      },
      // Business category
      {
        id: "sticker-6",
        name: "نجاح",
        imageUrl: "🎉",
        category: "business",
        isActive: true,
        sortOrder: 6,
        createdAt: new Date(),
      },
      {
        id: "sticker-7",
        name: "أموال",
        imageUrl: "💰",
        category: "business",
        isActive: true,
        sortOrder: 7,
        createdAt: new Date(),
      },
      {
        id: "sticker-8",
        name: "صفقة",
        imageUrl: "🤝",
        category: "business",
        isActive: true,
        sortOrder: 8,
        createdAt: new Date(),
      }
    ];

    mockStickers.forEach(sticker => {
      this.stickers.set(sticker.id, sticker);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.phoneNumber === phoneNumber,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      avatar: insertUser.avatar ?? null,
      isOnline: insertUser.isOnline ?? false,
      isVerified: false, // New users start unverified
      verifiedAt: null,  // No verification date until verified
      isAdmin: false, // New users start as non-admin
      lastSeen: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserOnlineStatus(id: string, isOnline: boolean): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.isOnline = isOnline;
      user.lastSeen = new Date();
      this.users.set(id, user);
    }
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser: User = {
      ...user,
      ...userData,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getChat(id: string): Promise<Chat | undefined> {
    return this.chats.get(id);
  }

  async getUserChats(userId: string): Promise<Chat[]> {
    return Array.from(this.chats.values()).filter(
      (chat) => chat.participants.includes(userId)
    ).sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));
  }

  async createChat(insertChat: InsertChat): Promise<Chat> {
    const id = randomUUID();
    const chat: Chat = { 
      ...insertChat, 
      id,
      name: insertChat.name ?? null,
      avatar: insertChat.avatar ?? null,
      isGroup: insertChat.isGroup ?? false,
      participants: [...insertChat.participants],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.chats.set(id, chat);
    return chat;
  }

  async deleteChat(id: string): Promise<boolean> {
    const chat = this.chats.get(id);
    if (!chat) return false;
    
    // Delete all messages in this chat
    const messagesToDelete = Array.from(this.messages.values())
      .filter(message => message.chatId === id);
    messagesToDelete.forEach(message => {
      this.messages.delete(message.id);
    });
    
    // Delete the chat itself
    this.chats.delete(id);
    return true;
  }

  async getChatMessages(chatId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((message) => message.chatId === chatId)
      .sort((a, b) => (a.timestamp?.getTime() ?? 0) - (b.timestamp?.getTime() ?? 0));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = { 
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
      timestamp: new Date(),
      isRead: false,
      isDelivered: true,
      isEdited: false,
      editedAt: null,
      deletedAt: null,
    };
    this.messages.set(id, message);
    
    // Update chat's updatedAt
    const chat = this.chats.get(insertMessage.chatId);
    if (chat) {
      chat.updatedAt = new Date();
      this.chats.set(chat.id, chat);
    }
    
    return message;
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
      .filter((message) => 
        message.chatId === chatId && 
        message.deletedAt === null &&
        message.content && 
        message.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => (a.timestamp?.getTime() ?? 0) - (b.timestamp?.getTime() ?? 0));
  }

  async updateMessage(messageId: string, content: string): Promise<Message | undefined> {
    const message = this.messages.get(messageId);
    if (message && message.deletedAt === null) {
      message.content = content;
      message.isEdited = true;
      message.editedAt = new Date();
      this.messages.set(messageId, message);
      return message;
    }
    return undefined;
  }

  async deleteMessage(messageId: string): Promise<void> {
    const message = this.messages.get(messageId);
    if (message) {
      message.deletedAt = new Date();
      this.messages.set(messageId, message);
    }
  }

  // Stories methods - filtered by user location
  async getActiveStories(): Promise<(Story & { user: User })[]> {
    const currentUser = await this.getUser("current-user");
    if (!currentUser) return [];

    const now = new Date();
    const activeStories = Array.from(this.stories.values())
      .filter(story => 
        story.expiresAt && 
        story.expiresAt > now && 
        story.location === currentUser.location // Filter by location
      )
      .sort((a, b) => (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0));

    const storiesWithUsers = await Promise.all(
      activeStories.map(async (story) => {
        const user = await this.getUser(story.userId);
        return {
          ...story,
          user: user!,
        };
      })
    );

    return storiesWithUsers;
  }

  async getUserStories(userId: string): Promise<Story[]> {
    const now = new Date();
    return Array.from(this.stories.values())
      .filter(story => story.userId === userId && story.expiresAt && story.expiresAt > now)
      .sort((a, b) => (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0));
  }

  async createStory(insertStory: InsertStory): Promise<Story> {
    const id = randomUUID();
    const story: Story = {
      ...insertStory,
      id,
      content: insertStory.content ?? null,
      imageUrl: insertStory.imageUrl ?? null,
      videoUrl: insertStory.videoUrl ?? null,
      backgroundColor: insertStory.backgroundColor ?? null,
      textColor: insertStory.textColor ?? null,
      timestamp: new Date(),
      viewCount: "0",
      viewers: (insertStory.viewers ?? []) as string[],
    };
    this.stories.set(id, story);
    return story;
  }

  async viewStory(storyId: string, viewerId: string): Promise<void> {
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

  async getStory(storyId: string): Promise<Story | undefined> {
    return this.stories.get(storyId);
  }

  // Authentication methods
  async createOtpCode(insertOtp: InsertOtp): Promise<OtpCode> {
    const id = randomUUID();
    const otp: OtpCode = {
      ...insertOtp,
      id,
      isUsed: false,
      createdAt: new Date(),
    };
    this.otpCodes.set(id, otp);
    return otp;
  }

  async verifyOtpCode(phoneNumber: string, code: string): Promise<boolean> {
    const otp = Array.from(this.otpCodes.values()).find(
      (otp) => otp.phoneNumber === phoneNumber && otp.code === code && !otp.isUsed && otp.expiresAt > new Date()
    );
    
    if (otp) {
      otp.isUsed = true;
      this.otpCodes.set(otp.id, otp);
      return true;
    }
    
    return false;
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = randomUUID();
    const session: Session = {
      ...insertSession,
      id,
      createdAt: new Date(),
    };
    this.sessions.set(session.token, session);
    return session;
  }

  async getSessionByToken(token: string): Promise<Session | undefined> {
    const session = this.sessions.get(token);
    if (session && session.expiresAt > new Date()) {
      return session;
    }
    return undefined;
  }

  async deleteSession(token: string): Promise<void> {
    this.sessions.delete(token);
  }

  // Products methods
  // Store methods
  async getStores(location?: string, category?: string): Promise<(Store & { owner: User })[]> {
    let stores = Array.from(this.stores.values()).filter(s => s.isActive && s.status === "approved");
    
    if (location) {
      stores = stores.filter(s => s.location === location);
    }
    
    if (category) {
      stores = stores.filter(s => s.category === category);
    }
    
    const storesWithOwners = await Promise.all(
      stores.map(async (store) => {
        const owner = await this.getUser(store.userId);
        return {
          ...store,
          owner: owner!,
        };
      })
    );

    return storesWithOwners.sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));
  }

  async getStore(id: string): Promise<Store | undefined> {
    return this.stores.get(id);
  }

  async getUserStore(userId: string): Promise<Store | undefined> {
    return Array.from(this.stores.values()).find(s => s.userId === userId);
  }

  async createStore(insertStore: InsertStore): Promise<Store> {
    const id = randomUUID();
    const store: Store = {
      ...insertStore,
      id,
      imageUrl: insertStore.imageUrl ?? null,
      phoneNumber: insertStore.phoneNumber ?? null,
      isOpen: insertStore.isOpen ?? true,
      isActive: false, // Start inactive until approved
      status: "pending", // Default status is pending approval
      isVerified: false, // New stores start unverified
      verifiedAt: null,  // No verification date until verified
      approvedAt: null, // No approval date until approved
      approvedBy: null, // No approver until approved
      rejectionReason: null, // No rejection reason initially
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.stores.set(id, store);
    return store;
  }

  async updateStore(id: string, updateData: Partial<InsertStore>): Promise<Store | undefined> {
    const store = this.stores.get(id);
    if (!store) return undefined;

    const updatedStore: Store = {
      ...store,
      ...updateData,
      updatedAt: new Date(),
    };
    this.stores.set(id, updatedStore);
    return updatedStore;
  }

  async deleteStore(id: string): Promise<boolean> {
    const store = this.stores.get(id);
    if (!store) return false;
    
    // Instead of deleting, mark as inactive
    const updatedStore: Store = {
      ...store,
      isActive: false,
      updatedAt: new Date(),
    };
    this.stores.set(id, updatedStore);
    return true;
  }

  async getStoreProducts(storeId: string): Promise<Product[]> {
    return Array.from(this.products.values())
      .filter(p => p.storeId === storeId && p.isActive)
      .sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));
  }

  async getProducts(location?: string, category?: string): Promise<(Product & { owner: User })[]> {
    let products = Array.from(this.products.values()).filter(p => p.isActive);
    
    if (location) {
      products = products.filter(p => p.location === location);
    }
    
    if (category) {
      products = products.filter(p => p.category === category);
    }
    
    const productsWithOwners = await Promise.all(
      products.map(async (product) => {
        const owner = await this.getUser(product.userId);
        return {
          ...product,
          owner: owner!,
        };
      })
    );

    return productsWithOwners.sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));
  }

  async getProduct(id: string): Promise<(Product & { owner: User }) | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const owner = await this.getUser(product.userId);
    if (!owner) return undefined;
    
    return {
      ...product,
      owner,
    };
  }

  async getUserProducts(userId: string): Promise<Product[]> {
    return Array.from(this.products.values())
      .filter(p => p.userId === userId)
      .sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = {
      ...insertProduct,
      id,
      storeId: insertProduct.storeId ?? null,
      imageUrl: insertProduct.imageUrl ?? null,
      isActive: insertProduct.isActive ?? true,
      commissionRate: insertProduct.commissionRate ?? "0.05",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: string, updateData: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;

    const updatedProduct: Product = {
      ...product,
      ...updateData,
      updatedAt: new Date(),
    };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  // Affiliate Links methods
  async createAffiliateLink(insertAffiliateLink: InsertAffiliateLink): Promise<AffiliateLink> {
    const id = randomUUID();
    const uniqueCode = `AFF${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    const affiliateLink: AffiliateLink = {
      ...insertAffiliateLink,
      id,
      uniqueCode,
      clicks: "0",
      conversions: "0",
      totalCommission: "0",
      createdAt: new Date(),
    };
    this.affiliateLinks.set(id, affiliateLink);
    return affiliateLink;
  }

  async getAffiliateLink(uniqueCode: string): Promise<AffiliateLink | undefined> {
    return Array.from(this.affiliateLinks.values()).find(link => link.uniqueCode === uniqueCode);
  }

  async getUserAffiliateLinks(userId: string): Promise<(AffiliateLink & { product: Product })[]> {
    const userLinks = Array.from(this.affiliateLinks.values())
      .filter(link => link.affiliateId === userId);

    const linksWithProducts = await Promise.all(
      userLinks.map(async (link) => {
        const product = await this.getProduct(link.productId);
        return {
          ...link,
          product: product!,
        };
      })
    );

    return linksWithProducts.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async trackClick(uniqueCode: string): Promise<void> {
    const link = await this.getAffiliateLink(uniqueCode);
    if (link) {
      const currentClicks = parseInt(link.clicks ?? "0");
      link.clicks = String(currentClicks + 1);
      this.affiliateLinks.set(link.id, link);
    }
  }

  async trackConversion(uniqueCode: string, buyerId: string, amount: string): Promise<Commission> {
    const link = await this.getAffiliateLink(uniqueCode);
    if (!link) throw new Error("Affiliate link not found");

    // Update link statistics
    const currentConversions = parseInt(link.conversions ?? "0");
    const currentTotalCommission = parseFloat(link.totalCommission ?? "0");
    link.conversions = String(currentConversions + 1);
    link.totalCommission = String(currentTotalCommission + parseFloat(amount));
    this.affiliateLinks.set(link.id, link);

    // Create commission record
    const commissionId = randomUUID();
    const commission: Commission = {
      id: commissionId,
      affiliateLinkId: link.id,
      buyerId,
      amount,
      status: "pending",
      transactionId: null,
      createdAt: new Date(),
      paidAt: null,
    };
    this.commissions.set(commissionId, commission);
    return commission;
  }

  // Commissions methods
  async getUserCommissions(userId: string): Promise<(Commission & { affiliateLink: AffiliateLink & { product: Product } })[]> {
    // Get all affiliate links for the user
    const userLinks = Array.from(this.affiliateLinks.values())
      .filter(link => link.affiliateId === userId);

    // Get commissions for those links
    const commissions = Array.from(this.commissions.values())
      .filter(commission => userLinks.some(link => link.id === commission.affiliateLinkId));

    const commissionsWithDetails = await Promise.all(
      commissions.map(async (commission) => {
        const affiliateLink = userLinks.find(link => link.id === commission.affiliateLinkId)!;
        const product = await this.getProduct(affiliateLink.productId);
        return {
          ...commission,
          affiliateLink: {
            ...affiliateLink,
            product: product!,
          },
        };
      })
    );

    return commissionsWithDetails.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async getTotalCommissions(userId: string): Promise<string> {
    const commissions = await this.getUserCommissions(userId);
    const total = commissions
      .filter(c => c.status === "paid")
      .reduce((sum, commission) => sum + parseFloat(commission.amount), 0);
    return total.toString();
  }

  async getCommissionsByStatus(userId: string, status: string): Promise<Commission[]> {
    const userCommissions = await this.getUserCommissions(userId);
    return userCommissions
      .filter(c => c.status === status)
      .map(c => ({
        id: c.id,
        affiliateLinkId: c.affiliateLinkId,
        buyerId: c.buyerId,
        amount: c.amount,
        status: c.status,
        transactionId: c.transactionId,
        createdAt: c.createdAt,
        paidAt: c.paidAt,
      }));
  }

  // Contacts methods
  async getUserContacts(userId: string): Promise<(Contact & { user?: User })[]> {
    const userContacts = Array.from(this.contacts.values())
      .filter(contact => contact.userId === userId);

    const contactsWithUsers = await Promise.all(
      userContacts.map(async (contact) => {
        let user = undefined;
        if (contact.contactUserId) {
          user = await this.getUser(contact.contactUserId);
        }
        return {
          ...contact,
          user,
        };
      })
    );

    return contactsWithUsers.sort((a, b) => (a.name.localeCompare(b.name)));
  }

  async addContact(insertContact: InsertContact): Promise<Contact> {
    const id = randomUUID();
    
    // Check if the phone number belongs to an existing user
    const existingUser = await this.getUserByPhoneNumber(insertContact.phoneNumber);
    
    const contact: Contact = {
      ...insertContact,
      id,
      contactUserId: existingUser?.id || null,
      isAppUser: !!existingUser,
      createdAt: new Date(),
    };
    this.contacts.set(id, contact);
    return contact;
  }

  async searchUserByPhoneNumber(phoneNumber: string): Promise<User | undefined> {
    return this.getUserByPhoneNumber(phoneNumber);
  }

  async updateContactAppUser(contactId: string, contactUserId: string): Promise<void> {
    const contact = this.contacts.get(contactId);
    if (contact) {
      contact.contactUserId = contactUserId;
      contact.isAppUser = true;
      this.contacts.set(contactId, contact);
    }
  }

  // Shopping Cart methods
  async getCartItems(userId: string): Promise<(CartItem & { product: Product & { owner: User } })[]> {
    const userCartItems = Array.from(this.cartItems.values())
      .filter(item => item.userId === userId);

    const itemsWithProducts = await Promise.all(
      userCartItems.map(async (item) => {
        const product = await this.getProduct(item.productId);
        const owner = await this.getUser(product!.userId);
        return {
          ...item,
          product: {
            ...product!,
            owner: owner!,
          },
        };
      })
    );

    return itemsWithProducts.sort((a, b) => (b.addedAt?.getTime() ?? 0) - (a.addedAt?.getTime() ?? 0));
  }

  async addToCart(insertCartItem: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const existingItem = Array.from(this.cartItems.values())
      .find(item => item.userId === insertCartItem.userId && item.productId === insertCartItem.productId);

    if (existingItem) {
      // Update quantity if item exists
      const newQuantity = parseInt(existingItem.quantity) + parseInt(insertCartItem.quantity || '1');
      existingItem.quantity = newQuantity.toString();
      this.cartItems.set(existingItem.id, existingItem);
      return existingItem;
    }

    // Add new item
    const id = randomUUID();
    const cartItem: CartItem = {
      ...insertCartItem,
      id,
      quantity: insertCartItem.quantity || '1',
      addedAt: new Date(),
    };
    this.cartItems.set(id, cartItem);
    return cartItem;
  }

  async updateCartItemQuantity(userId: string, productId: string, quantity: string): Promise<void> {
    const item = Array.from(this.cartItems.values())
      .find(item => item.userId === userId && item.productId === productId);
    
    if (item) {
      item.quantity = quantity;
      this.cartItems.set(item.id, item);
    }
  }

  async removeFromCart(userId: string, productId: string): Promise<void> {
    const item = Array.from(this.cartItems.values())
      .find(item => item.userId === userId && item.productId === productId);
    
    if (item) {
      this.cartItems.delete(item.id);
    }
  }

  async clearCart(userId: string): Promise<void> {
    const userCartItems = Array.from(this.cartItems.entries())
      .filter(([_, item]) => item.userId === userId);
    
    userCartItems.forEach(([id, _]) => {
      this.cartItems.delete(id);
    });
  }

  // Orders methods
  async createOrder(insertOrder: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const orderId = randomUUID();
    const order: Order = {
      ...insertOrder,
      id: orderId,
      status: insertOrder.status || 'pending',
      storeId: insertOrder.storeId || null,
      paymentMethod: insertOrder.paymentMethod || 'cash_on_delivery',
      notes: insertOrder.notes || null,
      cancellationReason: insertOrder.cancellationReason || null,
      orderDate: new Date(),
      confirmedAt: null,
      deliveredAt: null,
      cancelledAt: null,
    };
    this.orders.set(orderId, order);

    // Create order items
    items.forEach(insertItem => {
      const itemId = randomUUID();
      const orderItem: OrderItem = {
        ...insertItem,
        id: itemId,
        orderId,
      };
      this.orderItems.set(itemId, orderItem);
    });

    return order;
  }

  async getUserOrders(userId: string): Promise<(Order & { items: (OrderItem & { product: Product })[], seller: User })[]> {
    const userOrders = Array.from(this.orders.values())
      .filter(order => order.buyerId === userId);

    const ordersWithDetails = await Promise.all(
      userOrders.map(async (order) => {
        const items = Array.from(this.orderItems.values())
          .filter(item => item.orderId === order.id);
        
        const itemsWithProducts = await Promise.all(
          items.map(async (item) => {
            const product = await this.getProduct(item.productId);
            return {
              ...item,
              product: product!,
            };
          })
        );

        const seller = await this.getUser(order.sellerId);
        
        return {
          ...order,
          items: itemsWithProducts,
          seller: seller!,
        };
      })
    );

    return ordersWithDetails.sort((a, b) => (b.orderDate?.getTime() ?? 0) - (a.orderDate?.getTime() ?? 0));
  }

  async getSellerOrders(sellerId: string): Promise<(Order & { items: (OrderItem & { product: Product })[], buyer: User })[]> {
    const sellerOrders = Array.from(this.orders.values())
      .filter(order => order.sellerId === sellerId);

    const ordersWithDetails = await Promise.all(
      sellerOrders.map(async (order) => {
        const items = Array.from(this.orderItems.values())
          .filter(item => item.orderId === order.id);
        
        const itemsWithProducts = await Promise.all(
          items.map(async (item) => {
            const product = await this.getProduct(item.productId);
            return {
              ...item,
              product: product!,
            };
          })
        );

        const buyer = await this.getUser(order.buyerId);
        
        return {
          ...order,
          items: itemsWithProducts,
          buyer: buyer!,
        };
      })
    );

    return ordersWithDetails.sort((a, b) => (b.orderDate?.getTime() ?? 0) - (a.orderDate?.getTime() ?? 0));
  }

  async getOrder(orderId: string): Promise<(Order & { items: (OrderItem & { product: Product })[], seller: User, buyer: User }) | undefined> {
    const order = this.orders.get(orderId);
    if (!order) return undefined;

    const items = Array.from(this.orderItems.values())
      .filter(item => item.orderId === orderId);
    
    const itemsWithProducts = await Promise.all(
      items.map(async (item) => {
        const product = await this.getProduct(item.productId);
        return {
          ...item,
          product: product!,
        };
      })
    );

    const seller = await this.getUser(order.sellerId);
    const buyer = await this.getUser(order.buyerId);
    
    return {
      ...order,
      items: itemsWithProducts,
      seller: seller!,
      buyer: buyer!,
    };
  }

  async updateOrderStatus(orderId: string, status: string, updatedBy: string): Promise<Order | undefined> {
    const order = this.orders.get(orderId);
    if (!order) return undefined;

    order.status = status;
    
    // Update timestamps based on status
    const now = new Date();
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

  async cancelOrder(orderId: string, reason: string): Promise<Order | undefined> {
    const order = this.orders.get(orderId);
    if (!order) return undefined;

    order.status = "cancelled";
    order.cancelledAt = new Date();
    order.cancellationReason = reason;

    this.orders.set(orderId, order);
    return order;
  }

  // Verification Requests
  async createVerificationRequest(request: InsertVerificationRequest): Promise<VerificationRequest> {
    const id = randomUUID();
    const verificationRequest: VerificationRequest = {
      id,
      userId: request.userId,
      storeId: request.storeId || null,
      requestType: request.requestType,
      status: request.status || "pending",
      documents: (request.documents as string[]) || [],
      reason: request.reason || null,
      adminNote: request.adminNote || null,
      submittedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
    };
    this.verificationRequests.set(id, verificationRequest);
    return verificationRequest;
  }

  async getUserVerificationRequests(userId: string): Promise<VerificationRequest[]> {
    return Array.from(this.verificationRequests.values())
      .filter(request => request.userId === userId)
      .sort((a, b) => (b.submittedAt?.getTime() ?? 0) - (a.submittedAt?.getTime() ?? 0));
  }

  async getVerificationRequest(id: string): Promise<VerificationRequest | undefined> {
    return this.verificationRequests.get(id);
  }

  async updateVerificationRequestStatus(
    id: string, 
    status: string, 
    reviewedBy?: string,
    adminNote?: string
  ): Promise<VerificationRequest | undefined> {
    const request = this.verificationRequests.get(id);
    if (!request) return undefined;

    request.status = status;
    request.adminNote = adminNote || null;
    request.reviewedBy = reviewedBy || null;
    request.reviewedAt = new Date();

    // If approved, also update user verification status
    if (status === 'approved' && request.requestType === 'user') {
      const user = this.users.get(request.userId);
      if (user) {
        user.isVerified = true;
        user.verifiedAt = new Date();
        this.users.set(request.userId, user);
      }
    }

    this.verificationRequests.set(id, request);
    return request;
  }

  // ======================
  // ADMIN FUNCTIONS
  // ======================

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getAllVerificationRequests(status?: string): Promise<VerificationRequest[]> {
    let requests = Array.from(this.verificationRequests.values());
    
    if (status) {
      requests = requests.filter(request => request.status === status);
    }
    
    return requests.sort((a, b) => (b.submittedAt?.getTime() ?? 0) - (a.submittedAt?.getTime() ?? 0));
  }

  async updateUserAdminStatus(userId: string, isAdmin: boolean): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    user.isAdmin = isAdmin;
    this.users.set(userId, user);
    return user;
  }

  async updateUserVerificationStatus(userId: string, isVerified: boolean): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    user.isVerified = isVerified;
    user.verifiedAt = isVerified ? new Date() : null;
    this.users.set(userId, user);
    return user;
  }

  async getAllStores(): Promise<Store[]> {
    return Array.from(this.stores.values());
  }

  async updateStoreStatus(storeId: string, status: string, adminId?: string, rejectionReason?: string): Promise<Store | undefined> {
    const store = this.stores.get(storeId);
    if (!store) return undefined;

    const updatedStore: Store = {
      ...store,
      status: status as "pending" | "approved" | "rejected" | "suspended",
      isActive: status === "approved", // Only active if approved
      approvedAt: status === "approved" ? new Date() : store.approvedAt,
      approvedBy: status === "approved" && adminId ? adminId : store.approvedBy,
      rejectionReason: status === "rejected" ? rejectionReason || null : null,
      updatedAt: new Date(),
    };
    
    this.stores.set(storeId, updatedStore);
    return updatedStore;
  }

  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getAdminDashboardStats(): Promise<{
    totalUsers: number;
    totalStores: number;
    totalOrders: number;
    pendingVerifications: number;
    recentOrders: number;
    totalRevenue: string;
    activeUsers: number;
    verifiedUsers: number;
  }> {
    const users = Array.from(this.users.values());
    const stores = Array.from(this.stores.values());
    const orders = Array.from(this.orders.values());
    const verificationRequests = Array.from(this.verificationRequests.values());

    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const totalRevenue = orders
      .filter(order => order.status === 'delivered')
      .reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);

    const recentOrders = orders.filter(order => 
      order.orderDate && order.orderDate >= last24Hours
    ).length;

    const activeUsers = users.filter(user => 
      user.lastSeen && user.lastSeen >= last24Hours
    ).length;

    const verifiedUsers = users.filter(user => user.isVerified).length;

    const pendingVerifications = verificationRequests.filter(request => 
      request.status === 'pending'
    ).length;

    return {
      totalUsers: users.length,
      totalStores: stores.length,
      totalOrders: orders.length,
      pendingVerifications,
      recentOrders,
      totalRevenue: totalRevenue.toFixed(2),
      activeUsers,
      verifiedUsers,
    };
  }

  // Story Likes Implementation
  async likeStory(storyId: string, userId: string, reactionType: string = 'like'): Promise<StoryLike> {
    // Remove existing like if any
    const existingLike = Array.from(this.storyLikes.values()).find(
      like => like.storyId === storyId && like.userId === userId
    );
    
    if (existingLike) {
      this.storyLikes.delete(existingLike.id);
    }

    const newLike: StoryLike = {
      id: randomUUID(),
      storyId,
      userId,
      reactionType,
      createdAt: new Date(),
    };

    this.storyLikes.set(newLike.id, newLike);
    return newLike;
  }

  async unlikeStory(storyId: string, userId: string): Promise<void> {
    const existingLike = Array.from(this.storyLikes.values()).find(
      like => like.storyId === storyId && like.userId === userId
    );
    
    if (existingLike) {
      this.storyLikes.delete(existingLike.id);
    }
  }

  async getStoryLikes(storyId: string): Promise<(StoryLike & { user: User })[]> {
    const likes = Array.from(this.storyLikes.values())
      .filter(like => like.storyId === storyId);
    
    return likes.map(like => ({
      ...like,
      user: this.users.get(like.userId)!,
    })).filter(like => like.user); // Filter out likes from deleted users
  }

  async getStoryLikeCount(storyId: string): Promise<number> {
    return Array.from(this.storyLikes.values())
      .filter(like => like.storyId === storyId).length;
  }

  async hasUserLikedStory(storyId: string, userId: string): Promise<boolean> {
    return Array.from(this.storyLikes.values())
      .some(like => like.storyId === storyId && like.userId === userId);
  }

  // Story Comments Implementation
  async addStoryComment(comment: InsertStoryComment): Promise<StoryComment> {
    const newComment: StoryComment = {
      id: randomUUID(),
      ...comment,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.storyComments.set(newComment.id, newComment);
    return newComment;
  }

  async getStoryComments(storyId: string): Promise<(StoryComment & { user: User })[]> {
    const comments = Array.from(this.storyComments.values())
      .filter(comment => comment.storyId === storyId)
      .sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0)); // Sort by creation time
    
    return comments.map(comment => ({
      ...comment,
      user: this.users.get(comment.userId)!,
    })).filter(comment => comment.user); // Filter out comments from deleted users
  }

  async updateStoryComment(commentId: string, content: string): Promise<StoryComment | undefined> {
    const comment = this.storyComments.get(commentId);
    if (!comment) return undefined;

    comment.content = content;
    comment.updatedAt = new Date();
    this.storyComments.set(commentId, comment);
    return comment;
  }

  async deleteStoryComment(commentId: string): Promise<void> {
    this.storyComments.delete(commentId);
  }

  async getStoryCommentCount(storyId: string): Promise<number> {
    return Array.from(this.storyComments.values())
      .filter(comment => comment.storyId === storyId).length;
  }

  // Stickers Implementation
  async getAllStickers(): Promise<Sticker[]> {
    return Array.from(this.stickers.values())
      .filter(sticker => sticker.isActive)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  async getStickersByCategory(category: string): Promise<Sticker[]> {
    return Array.from(this.stickers.values())
      .filter(sticker => sticker.isActive && sticker.category === category)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  async getSticker(id: string): Promise<Sticker | undefined> {
    return this.stickers.get(id);
  }

  async createSticker(insertSticker: InsertSticker): Promise<Sticker> {
    const id = randomUUID();
    const sticker: Sticker = {
      ...insertSticker,
      id,
      category: insertSticker.category || "general",
      isActive: insertSticker.isActive ?? true,
      sortOrder: insertSticker.sortOrder ?? 0,
      createdAt: new Date(),
    };
    this.stickers.set(id, sticker);
    return sticker;
  }

  // Admin Credentials Implementation
  async getAdminCredentials(): Promise<AdminCredentials | undefined> {
    try {
      const result = await db.select().from(adminCredentials).where(eq(adminCredentials.id, 'admin_settings')).limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting admin credentials:', error);
      return this.adminCredentials; // Fallback to memory if DB fails
    }
  }

  async updateAdminCredentials(credentials: InsertAdminCredentials): Promise<AdminCredentials> {
    try {
      const adminCreds = {
        id: "admin_settings" as const,
        email: credentials.email,
        password: credentials.password,
        updatedAt: new Date(),
        createdAt: new Date(),
      };
      
      // Use upsert (insert or update)
      const result = await db.insert(adminCredentials)
        .values(adminCreds)
        .onConflictDoUpdate({
          target: adminCredentials.id,
          set: {
            email: credentials.email,
            password: credentials.password,
            updatedAt: new Date(),
          },
        })
        .returning();
      
      // Also update memory cache
      this.adminCredentials = result[0];
      return result[0];
    } catch (error) {
      console.error('Error updating admin credentials:', error);
      // Fallback to memory storage if DB fails
      const adminCreds: AdminCredentials = {
        id: "admin_settings",
        email: credentials.email,
        password: credentials.password,
        createdAt: this.adminCredentials?.createdAt || new Date(),
        updatedAt: new Date(),
      };
      this.adminCredentials = adminCreds;
      return adminCreds;
    }
  }

  // Feature Management Methods
  async getAllFeatures(): Promise<AppFeature[]> {
    try {
      const result = await db.select().from(appFeatures).orderBy(appFeatures.category, appFeatures.priority);
      return result;
    } catch (error) {
      console.error('Error getting features:', error);
      return Array.from(this.features.values());
    }
  }

  async getFeature(featureId: string): Promise<AppFeature | undefined> {
    try {
      const result = await db.select().from(appFeatures).where(eq(appFeatures.id, featureId)).limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting feature:', error);
      return this.features.get(featureId);
    }
  }

  async updateFeature(featureId: string, updates: Partial<InsertAppFeature>): Promise<AppFeature | undefined> {
    try {
      const result = await db.update(appFeatures)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(appFeatures.id, featureId))
        .returning();
      
      if (result[0]) {
        this.features.set(featureId, result[0]);
        return result[0];
      }
      return undefined;
    } catch (error) {
      console.error('Error updating feature:', error);
      // Fallback to memory
      const feature = this.features.get(featureId);
      if (feature) {
        const updatedFeature = { ...feature, ...updates, updatedAt: new Date() };
        this.features.set(featureId, updatedFeature);
        return updatedFeature;
      }
      return undefined;
    }
  }

  async initializeDefaultFeatures(): Promise<void> {
    const defaultFeatures: InsertAppFeature[] = [
      {
        id: "messaging",
        name: "المراسلة",
        description: "الدردشات الفردية والجماعية مع الرسائل النصية والصوتية والملفات",
        isEnabled: true,
        category: "communication",
        priority: 1
      },
      {
        id: "stories", 
        name: "الحالات/القصص",
        description: "انشر منتجك ومشاهدة حالات الآخرين لمدة 24 ساعة",
        isEnabled: true,
        category: "social",
        priority: 2
      },
      {
        id: "marketplace",
        name: "المتاجر",
        description: "تصفح المتاجر والمنتجات في منطقتك",
        isEnabled: true,
        category: "commerce",
        priority: 3
      },
      {
        id: "products",
        name: "المنتجات", 
        description: "عرض وبيع منتجاتك في السوق المحلي",
        isEnabled: true,
        category: "commerce",
        priority: 4
      },
      {
        id: "cart",
        name: "سلة التسوق",
        description: "إضافة المنتجات وإجراء عمليات الشراء",
        isEnabled: true,
        category: "commerce", 
        priority: 5
      },
      {
        id: "orders",
        name: "الطلبات",
        description: "متابعة طلباتك ومبيعاتك", 
        isEnabled: true,
        category: "commerce",
        priority: 6
      },
      {
        id: "affiliate",
        name: "التسويق بالعمولة",
        description: "ربح عمولة من خلال مشاركة المنتجات",
        isEnabled: true,
        category: "monetization",
        priority: 7
      },
      {
        id: "contacts",
        name: "جهات الاتصال",
        description: "إدارة الأصدقاء وجهات الاتصال",
        isEnabled: true,
        category: "communication",
        priority: 8
      },
      {
        id: "profile",
        name: "الملف الشخصي",
        description: "إعدادات وبيانات المستخدم الشخصية",
        isEnabled: true,
        category: "account",
        priority: 9
      }
    ];

    try {
      // Check if features already exist in database
      const existingFeatures = await db.select().from(appFeatures);
      
      if (existingFeatures.length === 0) {
        // Insert default features into database
        await db.insert(appFeatures).values(defaultFeatures);
        console.log('Default features initialized in database');
      }
      
      // Load features into memory
      const allFeatures = await db.select().from(appFeatures);
      allFeatures.forEach(feature => {
        this.features.set(feature.id, feature);
      });
      
    } catch (error) {
      console.error('Error initializing features in database, using memory fallback:', error);
      // Fallback to memory storage
      defaultFeatures.forEach(feature => {
        const fullFeature: AppFeature = {
          ...feature,
          category: feature.category || "general",
          isEnabled: feature.isEnabled ?? true,
          priority: feature.priority ?? 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.features.set(feature.id, fullFeature);
      });
    }
  }
}

export const storage = new MemStorage();
