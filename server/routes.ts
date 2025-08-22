import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
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
  type Store,
  type Product,
  type AffiliateLink,
  type Commission
} from "@shared/schema";
import { randomUUID } from "crypto";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
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
  // File upload endpoint
  app.post("/api/upload/image", requireAuth, upload.single('image'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }
      
      // Generate a unique filename
      const fileExtension = path.extname(req.file.originalname);
      const fileName = `${randomUUID()}${fileExtension}`;
      const filePath = path.join('uploads', fileName);
      
      // In a real app, you might want to move the file to a proper location
      // or upload to cloud storage like AWS S3 or Cloudinary
      
      // For this demo, we'll return a URL that points to the uploaded file
      const imageUrl = `/uploads/${req.file.filename}`;
      
      res.json({ imageUrl });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload image" });
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

  // Serve uploaded files statically
  app.use("/uploads", (await import("express")).static("uploads"));

  const httpServer = createServer(app);
  return httpServer;
}
