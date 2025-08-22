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
  type Product,
  type InsertProduct,
  type AffiliateLink,
  type InsertAffiliateLink,
  type Commission,
  type InsertCommission
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
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
  
  // Stories
  getActiveStories(): Promise<(Story & { user: User })[]>;
  getUserStories(userId: string): Promise<Story[]>;
  createStory(story: InsertStory): Promise<Story>;
  viewStory(storyId: string, viewerId: string): Promise<void>;
  getStory(storyId: string): Promise<Story | undefined>;
  
  // Products
  getProducts(location?: string, category?: string): Promise<(Product & { owner: User })[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getUserProducts(userId: string): Promise<Product[]>;
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private chats: Map<string, Chat>;
  private messages: Map<string, Message>;
  private stories: Map<string, Story>;
  private sessions: Map<string, Session>;
  private otpCodes: Map<string, OtpCode>;
  private products: Map<string, Product>;
  private affiliateLinks: Map<string, AffiliateLink>;
  private commissions: Map<string, Commission>;

  constructor() {
    this.users = new Map();
    this.chats = new Map();
    this.messages = new Map();
    this.stories = new Map();
    this.sessions = new Map();
    this.otpCodes = new Map();
    this.products = new Map();
    this.affiliateLinks = new Map();
    this.commissions = new Map();
    this.initializeMockData();
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
        timestamp: new Date(Date.now() - 1800000), // 30 min ago
        isRead: true,
        isDelivered: true,
      },
      {
        id: "msg-2",
        chatId: "chat-sarah",
        senderId: "current-user",
        content: "الحمد لله بخير! وأنت كيف حالك؟",
        messageType: "text",
        imageUrl: null,
        timestamp: new Date(Date.now() - 1740000), // 29 min ago
        isRead: true,
        isDelivered: true,
      },
      {
        id: "msg-3",
        chatId: "chat-sarah",
        senderId: "sarah-user",
        content: "شاهد هذا المنظر الرائع!",
        messageType: "image",
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300",
        timestamp: new Date(Date.now() - 1500000), // 25 min ago
        isRead: true,
        isDelivered: true,
      },
      {
        id: "msg-4",
        chatId: "chat-sarah",
        senderId: "current-user",
        content: "واو! 😍 منظر خلاب فعلاً. أين هذا المكان؟",
        messageType: "text",
        imageUrl: null,
        timestamp: new Date(Date.now() - 1440000), // 24 min ago
        isRead: true,
        isDelivered: true,
      },
      {
        id: "msg-5",
        chatId: "chat-sarah",
        senderId: "sarah-user",
        content: "هذا في جبال الألب السويسرية 🏔️",
        messageType: "text",
        imageUrl: null,
        timestamp: new Date(Date.now() - 1380000), // 23 min ago
        isRead: true,
        isDelivered: true,
      },
      {
        id: "msg-6",
        chatId: "chat-sarah",
        senderId: "sarah-user",
        content: "وهذا الغداء الذي تناولته هناك 🍽️",
        messageType: "image",
        imageUrl: "https://pixabay.com/get/gea1be77aa5dcbc2d39439c59e6b5feac148a0dfca36adf924c39583adb8620c2dc7693eb1b91ae3403b59786254a797ddd8c179d871743545cf7ddeb15b970ef_1280.jpg",
        timestamp: new Date(Date.now() - 1320000), // 22 min ago
        isRead: true,
        isDelivered: true,
      },
      {
        id: "msg-7",
        chatId: "chat-sarah",
        senderId: "current-user",
        content: "يبدو لذيذاً جداً! 🤤 متى ستعودين؟",
        messageType: "text",
        imageUrl: null,
        timestamp: new Date(Date.now() - 1200000), // 20 min ago
        isRead: true,
        isDelivered: true,
      },
      {
        id: "msg-8",
        chatId: "chat-sarah",
        senderId: "sarah-user",
        content: "سأعود الأسبوع القادم إن شاء الله",
        messageType: "image",
        imageUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300",
        timestamp: new Date(Date.now() - 1140000), // 19 min ago
        isRead: true,
        isDelivered: true,
      },
      {
        id: "msg-9",
        chatId: "chat-sarah",
        senderId: "current-user",
        content: "بالمناسبة، هل تتذكرين هذا المكان؟ 🌲",
        messageType: "image",
        imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300",
        timestamp: new Date(Date.now() - 1020000), // 17 min ago
        isRead: true,
        isDelivered: true,
      },
      {
        id: "msg-10",
        chatId: "chat-sarah",
        senderId: "sarah-user",
        content: "أجل! المقهى الذي كنا نذهب إليه ☕",
        messageType: "image",
        imageUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300",
        timestamp: new Date(Date.now() - 960000), // 16 min ago
        isRead: true,
        isDelivered: true,
      },
      {
        id: "msg-11",
        chatId: "chat-sarah",
        senderId: "current-user",
        content: "نعم! ذكريات جميلة 😊 سأنتظر عودتك",
        messageType: "text",
        imageUrl: null,
        timestamp: new Date(Date.now() - 900000), // 15 min ago
        isRead: false,
        isDelivered: true,
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
      messageType: insertMessage.messageType ?? "text",
      imageUrl: insertMessage.imageUrl ?? null,
      timestamp: new Date(),
      isRead: false,
      isDelivered: true,
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

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
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
}

export const storage = new MemStorage();
