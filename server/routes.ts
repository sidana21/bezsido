import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
  insertMessageSchema, 
  insertStorySchema, 
  insertOtpSchema, 
  insertUserSchema, 
  insertSessionSchema,
  insertChatSchema,
  insertStoreSchema,
  insertProductSchema,
  insertAffiliateLinkSchema,
  insertCommissionSchema,
  insertContactSchema,
  insertCartItemSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  type Store,
  type Product,
  type AffiliateLink,
  type Commission,
  type CartItem,
  type Order
} from "@shared/schema";
import { randomUUID } from "crypto";

// Configure multer for file uploads (images and videos)
const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
      // Keep original extension for better file handling
      const fileExtension = path.extname(file.originalname);
      const fileName = `${randomUUID()}${fileExtension}`;
      cb(null, fileName);
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    // Accept image, video, and audio files
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image, video, and audio files are allowed'));
    }
  }
});

// Configure multer for audio uploads using memory storage
const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for audio files
  },
  fileFilter: (req, file, cb) => {
    console.log('Audio file upload - MIME type:', file.mimetype);
    if (file.mimetype.startsWith('audio/') || 
        file.mimetype === 'audio/wav' || 
        file.mimetype === 'audio/webm' ||
        file.mimetype === 'audio/mp4' ||
        file.mimetype === 'audio/mpeg' ||
        file.originalname.endsWith('.webm') ||
        file.originalname.endsWith('.wav') ||
        file.originalname.endsWith('.mp3') ||
        file.originalname.endsWith('.mp4')) {
      cb(null, true);
    } else {
      console.log('Rejected file type:', file.mimetype, file.originalname);
      cb(new Error('Only audio files are allowed'));
    }
  }
});

// Middleware to check authentication
const requireAuth = async (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files statically
  app.use('/uploads', express.static('uploads'));
  
  // File upload endpoint for images and videos
  app.post("/api/upload/media", requireAuth, upload.single('media'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No media file provided" });
      }
      
      // Determine file type
      const fileType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
      
      // The file is already saved by multer, just return the URL
      const mediaUrl = `/uploads/${req.file.filename}`;
      
      res.json({ 
        mediaUrl,
        fileType,
        fileName: req.file.originalname,
        size: req.file.size
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: "Failed to upload media file" });
    }
  });

  // Authentication routes
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required" });
      }
      
      // Generate 6-digit OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      const otpData = insertOtpSchema.parse({
        phoneNumber,
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        isUsed: false,
      });
      
      await storage.createOtpCode(otpData);
      
      // In a real app, you would send the OTP via SMS
      console.log(`OTP for ${phoneNumber}: ${code}`);
      
      // Store last OTP for development
      (global as any).lastOtp = { phoneNumber, code, timestamp: Date.now() };
      
      res.json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });
  
  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { phoneNumber, code, name, location } = req.body;
      
      if (!phoneNumber || !code) {
        return res.status(400).json({ message: "Phone number and code are required" });
      }
      
      const isValidOtp = await storage.verifyOtpCode(phoneNumber, code);
      
      if (!isValidOtp) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }
      
      // Find or create user
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
        });
        
        user = await storage.createUser(userData);
      } else {
        // Update online status
        await storage.updateUserOnlineStatus(user.id, true);
      }
      
      // Create session
      const token = randomUUID();
      const sessionData = insertSessionSchema.parse({
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
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

  // Create new user after OTP verification
  app.post("/api/auth/create-user", async (req, res) => {
    try {
      const { phoneNumber, name, location } = req.body;
      
      if (!phoneNumber || !name || !location) {
        return res.status(400).json({ message: "Phone number, name and location are required" });
      }
      
      // Check if user already exists
      let user = await storage.getUserByPhoneNumber(phoneNumber);
      
      if (user) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      // Create user
      const userData = insertUserSchema.parse({
        phoneNumber,
        name,
        location,
        avatar: null,
        isOnline: true,
      });
      
      user = await storage.createUser(userData);
      
      // Create session
      const token = randomUUID();
      const sessionData = insertSessionSchema.parse({
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
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

  // Development endpoint to get last OTP
  app.get("/api/dev/last-otp", (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(404).json({ message: "Not found" });
    }
    const lastOtp = (global as any).lastOtp;
    if (lastOtp && Date.now() - lastOtp.timestamp < 300000) { // 5 minutes
      res.json({ code: lastOtp.code, phoneNumber: lastOtp.phoneNumber });
    } else {
      res.json({ code: null });
    }
  });
  
  app.post("/api/auth/logout", requireAuth, async (req: any, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        await storage.deleteSession(token);
        await storage.updateUserOnlineStatus(req.userId, false);
      }
      res.json({ success: true, message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to logout" });
    }
  });

  // Get current user
  app.get("/api/user/current", requireAuth, async (req: any, res) => {
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

  // Update user profile
  app.put("/api/user/profile", requireAuth, async (req: any, res) => {
    try {
      const { name, location, avatar, avatarUrl } = req.body;
      
      if (!name || !location) {
        return res.status(400).json({ message: "Name and location are required" });
      }
      
      // Update user data - accept both avatar and avatarUrl for compatibility
      const updatedUser = await storage.updateUser(req.userId, {
        name: name.trim(),
        location: location.trim(),
        avatar: avatar || avatarUrl || null,
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

  // Get user chats
  app.get("/api/chats", requireAuth, async (req: any, res) => {
    try {
      const chats = await storage.getUserChats(req.userId);
      
      // Add last message and unread count to each chat
      const chatsWithDetails = await Promise.all(
        chats.map(async (chat) => {
          const messages = await storage.getChatMessages(chat.id);
          const lastMessage = messages[messages.length - 1] || null;
          const unreadCount = messages.filter(msg => 
            msg.senderId !== req.userId && !msg.isRead
          ).length;
          
          // Get other participant info for individual chats
          let otherParticipant = null;
          if (!chat.isGroup && chat.participants.length === 2) {
            const otherParticipantId = chat.participants.find(id => id !== req.userId);
            if (otherParticipantId) {
              otherParticipant = await storage.getUser(otherParticipantId);
            }
          }
          
          return {
            ...chat,
            lastMessage,
            unreadCount,
            otherParticipant,
          };
        })
      );
      
      res.json(chatsWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to get chats" });
    }
  });

  // Create or get existing chat with another user
  app.post("/api/chats/start", requireAuth, async (req: any, res) => {
    try {
      const { otherUserId } = req.body;
      
      if (!otherUserId) {
        return res.status(400).json({ message: "Other user ID is required" });
      }
      
      if (otherUserId === req.userId) {
        return res.status(400).json({ message: "Cannot start chat with yourself" });
      }
      
      // Check if other user exists
      const otherUser = await storage.getUser(otherUserId);
      if (!otherUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Find existing chat between these two users
      const allChats = await storage.getUserChats(req.userId);
      const existingChat = allChats.find(chat => 
        !chat.isGroup && 
        chat.participants.length === 2 && 
        chat.participants.includes(otherUserId)
      );
      
      if (existingChat) {
        return res.json({ chatId: existingChat.id, isNew: false });
      }
      
      // Create new chat
      const chatData = insertChatSchema.parse({
        name: null,
        isGroup: false,
        avatar: null,
        participants: [req.userId, otherUserId],
      });
      
      const newChat = await storage.createChat(chatData);
      res.json({ chatId: newChat.id, isNew: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to start chat" });
    }
  });

  // Get chat messages
  app.get("/api/chats/:chatId/messages", requireAuth, async (req: any, res) => {
    try {
      const { chatId } = req.params;
      const messages = await storage.getChatMessages(chatId);
      
      // Include sender info with each message
      const messagesWithSenders = await Promise.all(
        messages.map(async (message) => {
          const sender = await storage.getUser(message.senderId);
          return {
            ...message,
            sender,
          };
        })
      );
      
      res.json(messagesWithSenders);
    } catch (error) {
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  // Send message
  app.post("/api/chats/:chatId/messages", requireAuth, async (req: any, res) => {
    try {
      const { chatId } = req.params;
      const messageData = insertMessageSchema.parse({
        ...req.body,
        chatId,
        senderId: req.userId,
      });
      
      const message = await storage.createMessage(messageData);
      const sender = await storage.getUser(message.senderId);
      
      res.json({
        ...message,
        sender,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Send audio message
  app.post("/api/chats/:chatId/messages/audio", requireAuth, audioUpload.single('audio'), async (req: any, res) => {
    try {
      const { chatId } = req.params;
      const { messageType, replyToId } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ message: "No audio file provided" });
      }

      // Generate a unique filename for the audio
      const audioFilename = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.wav`;
      const audioUrl = `/uploads/${audioFilename}`;
      
      // Move the file to uploads directory
      const uploadDir = path.join(process.cwd(), 'uploads');
      
      // Create uploads directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      // Move the file
      fs.writeFileSync(path.join(uploadDir, audioFilename), req.file.buffer);

      const messageData = insertMessageSchema.parse({
        chatId,
        senderId: req.userId,
        content: null,
        messageType: 'audio',
        audioUrl: audioUrl,
        replyToMessageId: replyToId || null,
      });
      
      const message = await storage.createMessage(messageData);
      const sender = await storage.getUser(message.senderId);
      
      res.json({
        ...message,
        sender,
      });
    } catch (error) {
      console.error('Error sending audio message:', error);
      res.status(500).json({ message: "Failed to send audio message" });
    }
  });

  app.delete("/api/chats/:chatId", requireAuth, async (req: any, res) => {
    try {
      const { chatId } = req.params;
      
      // Check if user is participant in this chat
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

  // Mark message as read
  app.patch("/api/messages/:messageId/read", requireAuth, async (req: any, res) => {
    try {
      const { messageId } = req.params;
      await storage.markMessageAsRead(messageId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // Search messages in a chat
  app.get("/api/chats/:chatId/messages/search", requireAuth, async (req: any, res) => {
    try {
      const { chatId } = req.params;
      const { q: searchTerm } = req.query;
      
      if (!searchTerm) {
        return res.status(400).json({ message: "Search term is required" });
      }
      
      const messages = await storage.searchMessages(chatId, searchTerm as string);
      
      // Include sender info with each message
      const messagesWithSenders = await Promise.all(
        messages.map(async (message) => {
          const sender = await storage.getUser(message.senderId);
          return {
            ...message,
            sender,
          };
        })
      );
      
      res.json(messagesWithSenders);
    } catch (error) {
      res.status(500).json({ message: "Failed to search messages" });
    }
  });

  // Update message content
  app.patch("/api/messages/:messageId", requireAuth, async (req: any, res) => {
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
        sender,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update message" });
    }
  });

  // Delete message
  app.delete("/api/messages/:messageId", requireAuth, async (req: any, res) => {
    try {
      const { messageId } = req.params;
      await storage.deleteMessage(messageId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // Get active stories
  app.get("/api/stories", requireAuth, async (req: any, res) => {
    try {
      const stories = await storage.getActiveStories();
      res.json(stories);
    } catch (error) {
      res.status(500).json({ message: "Failed to get stories" });
    }
  });

  // Get user stories
  app.get("/api/users/:userId/stories", requireAuth, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const stories = await storage.getUserStories(userId);
      res.json(stories);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user stories" });
    }
  });

  // Create story
  app.post("/api/stories", requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const storyData = insertStorySchema.parse({
        ...req.body,
        userId: req.userId,
        location: currentUser.location, // Use user's location
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      });
      
      const story = await storage.createStory(storyData);
      res.json(story);
    } catch (error) {
      res.status(500).json({ message: "Failed to create story" });
    }
  });

  // View story
  app.patch("/api/stories/:storyId/view", requireAuth, async (req: any, res) => {
    try {
      const { storyId } = req.params;
      await storage.viewStory(storyId, req.userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to view story" });
    }
  });

  // Get single story
  app.get("/api/stories/:storyId", requireAuth, async (req: any, res) => {
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

  // Stores endpoints
  app.get("/api/stores", requireAuth, async (req: any, res) => {
    try {
      const { location, category } = req.query;
      const stores = await storage.getStores(location, category);
      res.json(stores);
    } catch (error) {
      res.status(500).json({ message: "Failed to get stores" });
    }
  });

  app.get("/api/stores/:storeId", requireAuth, async (req: any, res) => {
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

  app.get("/api/user/store", requireAuth, async (req: any, res) => {
    try {
      const store = await storage.getUserStore(req.userId);
      res.json(store || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user store" });
    }
  });

  app.get("/api/stores/:storeId/products", requireAuth, async (req: any, res) => {
    try {
      const { storeId } = req.params;
      const products = await storage.getStoreProducts(storeId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to get store products" });
    }
  });

  app.post("/api/stores", requireAuth, async (req: any, res) => {
    try {
      // Check if user already has a store
      const existingStore = await storage.getUserStore(req.userId);
      if (existingStore) {
        return res.status(400).json({ message: "User already has a store" });
      }

      const storeData = insertStoreSchema.parse({
        ...req.body,
        userId: req.userId,
      });
      
      const store = await storage.createStore(storeData);
      res.json(store);
    } catch (error) {
      res.status(500).json({ message: "Failed to create store" });
    }
  });

  app.patch("/api/stores/:storeId", requireAuth, async (req: any, res) => {
    try {
      const { storeId } = req.params;
      
      // Check if user owns this store
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

  app.delete("/api/stores/:storeId", requireAuth, async (req: any, res) => {
    try {
      const { storeId } = req.params;
      
      // Check if user owns this store
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

  // Products endpoints
  app.get("/api/products", requireAuth, async (req: any, res) => {
    try {
      const { location, category } = req.query;
      const products = await storage.getProducts(location, category);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to get products" });
    }
  });

  app.get("/api/products/:productId", requireAuth, async (req: any, res) => {
    try {
      const { productId } = req.params;
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      const owner = await storage.getUser(product.userId);
      res.json({ ...product, owner });
    } catch (error) {
      res.status(500).json({ message: "Failed to get product" });
    }
  });

  app.get("/api/user/products", requireAuth, async (req: any, res) => {
    try {
      const products = await storage.getUserProducts(req.userId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user products" });
    }
  });

  app.get("/api/products/store/:storeId", async (req: any, res) => {
    try {
      const { storeId } = req.params;
      const products = await storage.getStoreProducts(storeId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to get store products" });
    }
  });

  app.post("/api/products", requireAuth, async (req: any, res) => {
    try {
      const productData = insertProductSchema.parse({
        ...req.body,
        userId: req.userId,
      });
      
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.patch("/api/products/:productId", requireAuth, async (req: any, res) => {
    try {
      const { productId } = req.params;
      
      // Check if user owns this product
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

  app.delete("/api/products/:productId", requireAuth, async (req: any, res) => {
    try {
      const { productId } = req.params;
      
      // Check if user owns this product
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

  // Affiliate marketing endpoints
  app.post("/api/affiliate-links", requireAuth, async (req: any, res) => {
    try {
      const affiliateLinkData = insertAffiliateLinkSchema.parse({
        ...req.body,
        affiliateId: req.userId,
      });
      
      // Check if product exists
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

  app.get("/api/user/affiliate-links", requireAuth, async (req: any, res) => {
    try {
      const links = await storage.getUserAffiliateLinks(req.userId);
      res.json(links);
    } catch (error) {
      res.status(500).json({ message: "Failed to get affiliate links" });
    }
  });

  // Track affiliate link click (no auth required for tracking)
  app.post("/api/affiliate/:uniqueCode/click", async (req: any, res) => {
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

  // Track conversion (when someone buys through affiliate link)
  app.post("/api/affiliate/:uniqueCode/conversion", requireAuth, async (req: any, res) => {
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

  // Commissions endpoints
  app.get("/api/user/commissions", requireAuth, async (req: any, res) => {
    try {
      const commissions = await storage.getUserCommissions(req.userId);
      res.json(commissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get commissions" });
    }
  });

  app.get("/api/user/commissions/total", requireAuth, async (req: any, res) => {
    try {
      const total = await storage.getTotalCommissions(req.userId);
      res.json({ total });
    } catch (error) {
      res.status(500).json({ message: "Failed to get total commissions" });
    }
  });

  app.get("/api/user/commissions/:status", requireAuth, async (req: any, res) => {
    try {
      const { status } = req.params;
      const commissions = await storage.getCommissionsByStatus(req.userId, status);
      res.json(commissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get commissions by status" });
    }
  });

  // Contacts endpoints
  app.get("/api/contacts", requireAuth, async (req: any, res) => {
    try {
      const contacts = await storage.getUserContacts(req.userId);
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get contacts" });
    }
  });

  app.post("/api/contacts", requireAuth, async (req: any, res) => {
    try {
      const contactData = insertContactSchema.parse({
        ...req.body,
        userId: req.userId,
      });
      
      const contact = await storage.addContact(contactData);
      res.json(contact);
    } catch (error) {
      res.status(500).json({ message: "Failed to add contact" });
    }
  });

  app.post("/api/contacts/search", requireAuth, async (req: any, res) => {
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

  // Shopping Cart endpoints
  app.get("/api/cart", requireAuth, async (req: any, res) => {
    try {
      const cartItems = await storage.getCartItems(req.userId);
      res.json(cartItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to get cart items" });
    }
  });

  app.post("/api/cart", requireAuth, async (req: any, res) => {
    try {
      const cartItemData = insertCartItemSchema.parse({
        ...req.body,
        userId: req.userId,
      });
      
      const cartItem = await storage.addToCart(cartItemData);
      res.json(cartItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to add item to cart" });
    }
  });

  app.put("/api/cart/:productId", requireAuth, async (req: any, res) => {
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

  app.delete("/api/cart/:productId", requireAuth, async (req: any, res) => {
    try {
      const { productId } = req.params;
      await storage.removeFromCart(req.userId, productId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove item from cart" });
    }
  });

  app.delete("/api/cart", requireAuth, async (req: any, res) => {
    try {
      await storage.clearCart(req.userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Orders endpoints
  app.post("/api/orders", requireAuth, async (req: any, res) => {
    try {
      const { order, items } = req.body;
      
      const orderData = insertOrderSchema.parse({
        ...order,
        buyerId: req.userId,
      });

      const orderItems = items.map((item: any) => insertOrderItemSchema.parse(item));
      
      const createdOrder = await storage.createOrder(orderData, orderItems);
      
      // Clear cart after successful order
      await storage.clearCart(req.userId);
      
      res.json(createdOrder);
    } catch (error) {
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get("/api/orders/user", requireAuth, async (req: any, res) => {
    try {
      const orders = await storage.getUserOrders(req.userId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user orders" });
    }
  });

  app.get("/api/orders/seller", requireAuth, async (req: any, res) => {
    try {
      const orders = await storage.getSellerOrders(req.userId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to get seller orders" });
    }
  });

  app.get("/api/orders/:orderId", requireAuth, async (req: any, res) => {
    try {
      const { orderId } = req.params;
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Check if user is buyer or seller
      if (order.buyerId !== req.userId && order.sellerId !== req.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to get order" });
    }
  });

  app.put("/api/orders/:orderId/status", requireAuth, async (req: any, res) => {
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

  app.put("/api/orders/:orderId/cancel", requireAuth, async (req: any, res) => {
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

  // Verification Requests routes
  app.post("/api/verification-requests", requireAuth, async (req: any, res) => {
    try {
      const { requestType, reason, documents, storeId } = req.body;
      
      const verificationRequestData = {
        userId: req.userId,
        requestType: requestType,
        reason: reason || null,
        documents: documents || [],
        storeId: storeId || null,
        status: "pending",
        adminNote: null,
        reviewedBy: null,
      };
      
      const verificationRequest = await storage.createVerificationRequest(verificationRequestData);
      res.json(verificationRequest);
    } catch (error) {
      res.status(500).json({ message: "Failed to create verification request" });
    }
  });

  app.get("/api/user/verification-requests", requireAuth, async (req: any, res) => {
    try {
      const requests = await storage.getUserVerificationRequests(req.userId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to get verification requests" });
    }
  });

  app.get("/api/verification-requests/:requestId", requireAuth, async (req: any, res) => {
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


  const httpServer = createServer(app);
  return httpServer;
}
