import { type User, type InsertUser, type Chat, type InsertChat, type Message, type InsertMessage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserOnlineStatus(id: string, isOnline: boolean): Promise<void>;
  
  // Chats
  getChat(id: string): Promise<Chat | undefined>;
  getUserChats(userId: string): Promise<Chat[]>;
  createChat(chat: InsertChat): Promise<Chat>;
  
  // Messages
  getChatMessages(chatId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(messageId: string): Promise<void>;
  markMessageAsDelivered(messageId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private chats: Map<string, Chat>;
  private messages: Map<string, Message>;

  constructor() {
    this.users = new Map();
    this.chats = new Map();
    this.messages = new Map();
    this.initializeMockData();
  }

  private initializeMockData() {
    // Create mock users
    const currentUser: User = {
      id: "current-user",
      username: "me",
      name: "أنا",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
      isOnline: true,
      lastSeen: new Date(),
    };

    const sarahUser: User = {
      id: "sarah-user",
      username: "sarah",
      name: "سارة أحمد",
      avatar: "https://pixabay.com/get/g5ede2eab7ebacb14e91863d35be3f093549755f13131724e5e19c6a49a45921c44adc3a540b01f28abed2c4568cf8e907881a83c9d0679b2c22c054985afc7d2_1280.jpg",
      isOnline: true,
      lastSeen: new Date(),
    };

    const ahmedUser: User = {
      id: "ahmed-user",
      username: "ahmed",
      name: "أحمد محمد",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
      isOnline: false,
      lastSeen: new Date(Date.now() - 86400000), // 1 day ago
    };

    const fatimaUser: User = {
      id: "fatima-user",
      username: "fatima",
      name: "فاطمة علي",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
      isOnline: true,
      lastSeen: new Date(),
    };

    const mariamUser: User = {
      id: "mariam-user",
      username: "mariam",
      name: "مريم حسن",
      avatar: "https://images.unsplash.com/photo-1589156191108-c762ff4b96ab?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
      isOnline: true,
      lastSeen: new Date(),
    };

    const yousefUser: User = {
      id: "yousef-user",
      username: "yousef",
      name: "يوسف إبراهيم",
      avatar: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
      isOnline: false,
      lastSeen: new Date(Date.now() - 172800000), // 2 days ago
    };

    const abdullahUser: User = {
      id: "abdullah-user",
      username: "abdullah",
      name: "عبدالله خالد",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
      isOnline: false,
      lastSeen: new Date(Date.now() - 259200000), // 3 days ago
    };

    const lailaUser: User = {
      id: "laila-user",
      username: "laila",
      name: "ليلى أحمد",
      avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
      isOnline: false,
      lastSeen: new Date(Date.now() - 345600000), // 4 days ago
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
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      isOnline: false,
      lastSeen: new Date(),
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
    ).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async createChat(insertChat: InsertChat): Promise<Chat> {
    const id = randomUUID();
    const chat: Chat = { 
      ...insertChat, 
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.chats.set(id, chat);
    return chat;
  }

  async getChatMessages(chatId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((message) => message.chatId === chatId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = { 
      ...insertMessage, 
      id,
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
}

export const storage = new MemStorage();
