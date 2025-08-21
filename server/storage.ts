import { type User, type InsertUser, type Chat, type InsertChat, type Message, type InsertMessage, type Story, type InsertStory, type Session, type InsertSession, type OtpCode, type InsertOtp } from "@shared/schema";
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private chats: Map<string, Chat>;
  private messages: Map<string, Message>;
  private stories: Map<string, Story>;
  private sessions: Map<string, Session>;
  private otpCodes: Map<string, OtpCode>;

  constructor() {
    this.users = new Map();
    this.chats = new Map();
    this.messages = new Map();
    this.stories = new Map();
    this.sessions = new Map();
    this.otpCodes = new Map();
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
      isOnline: false,
      lastSeen: new Date(Date.now() - 345600000), // 4 days ago
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    [currentUser, sarahUser, ahmedUser, fatimaUser, mariamUser, yousefUser, abdullahUser, lailaUser].forEach(user => {
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.chats.set(id, chat);
    return chat;
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
}

export const storage = new MemStorage();
