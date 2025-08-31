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
  insertStoryLikeSchema,
  insertStoryCommentSchema,
  type Store,
  type Product,
  type AffiliateLink,
  type Commission,
  type CartItem,
  type Order
} from "@shared/schema";
import { randomUUID } from "crypto";
import { AdminManager } from "./admin-manager";

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

// Admin authentication middleware
const requireAdmin = async (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  
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
      
      // Store last OTP for development
      (global as any).lastOtp = { phoneNumber, code, timestamp: Date.now() };
      
      let smsDelivered = false;
      let smsError = null;
      
      // Try to send SMS via Twilio if credentials are available
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
        try {
          const { default: twilio } = await import('twilio');
          const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
          
          await client.messages.create({
            body: `رمز التحقق الخاص بك في BizChat هو: ${code}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber
          });
          
          smsDelivered = true;
          console.log(`✅ SMS sent successfully to ${phoneNumber}: ${code}`);
        } catch (twilioError: any) {
          smsError = twilioError.message;
          console.error('❌ Twilio SMS error:', twilioError);
        }
      } else {
        console.log('ℹ️ Twilio credentials not configured, showing OTP directly');
      }
      
      // Show OTP directly in development or if SMS failed
      const shouldShowOTP = !smsDelivered || process.env.NODE_ENV === 'development';
      
      let message = "تم إرسال رمز التحقق عبر الرسائل النصية";
      if (shouldShowOTP) {
        message = smsDelivered ? 
          `تم إرسال الرمز عبر SMS وهو: ${code}` : 
          `رمز التحقق: ${code}`;
      }
      
      // Log for debugging
      console.log(`OTP for ${phoneNumber}: ${code} (SMS delivered: ${smsDelivered})`);
      
      res.json({ 
        success: true, 
        message,
        code: shouldShowOTP ? code : undefined,
        showDirectly: shouldShowOTP,
        smsDelivered,
        smsError: process.env.NODE_ENV === 'development' ? smsError : undefined
      });
    } catch (error) {
      console.error('OTP sending error:', error);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });
  
  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { phoneNumber, code } = req.body;
      
      if (!phoneNumber || !code) {
        return res.status(400).json({ message: "Phone number and code are required" });
      }
      
      const isValidOtp = await storage.verifyOtpCode(phoneNumber, code);
      
      if (!isValidOtp) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }
      
      // Check if user exists
      let user = await storage.getUserByPhoneNumber(phoneNumber);
      
      if (!user) {
        // OTP is valid but user doesn't exist - need profile setup
        return res.json({ 
          success: true, 
          needsProfile: true,
          message: "OTP verified successfully. Please complete your profile." 
        });
      } else {
        // Existing user - update online status and create session
        await storage.updateUserOnlineStatus(user.id, true);
        
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
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });

  // Create new user after OTP verification
  app.post("/api/auth/create-user", async (req, res) => {
    try {
      const { phoneNumber, name, location } = req.body;
      
      console.log("📱 Creating user with:", { phoneNumber, name, location });
      
      // Validate input data
      if (!phoneNumber || typeof phoneNumber !== 'string' || !phoneNumber.trim()) {
        console.log("❌ Missing or invalid phone number:", phoneNumber);
        return res.status(400).json({ 
          success: false,
          message: "رقم الهاتف مطلوب وصالح" 
        });
      }
      
      if (!name || typeof name !== 'string' || !name.trim()) {
        console.log("❌ Missing or invalid name:", name);
        return res.status(400).json({ 
          success: false,
          message: "الاسم مطلوب" 
        });
      }
      
      if (!location || typeof location !== 'string' || !location.trim()) {
        console.log("❌ Missing or invalid location:", location);
        return res.status(400).json({ 
          success: false,
          message: "المنطقة مطلوبة" 
        });
      }
      
      const cleanPhoneNumber = phoneNumber.trim();
      const cleanName = name.trim();
      const cleanLocation = location.trim();
      
      // Check if user already exists
      let user = await storage.getUserByPhoneNumber(cleanPhoneNumber);
      
      if (user) {
        console.log("👤 User already exists, logging them in:", user.id);
        
        // User exists, so log them in instead
        await storage.updateUserOnlineStatus(user.id, true);
        
        // Create session
        const token = randomUUID();
        const sessionData = insertSessionSchema.parse({
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        });
        
        await storage.createSession(sessionData);
        
        console.log("✅ Existing user logged in successfully:", user.id);
        return res.json({ 
          success: true, 
          user, 
          token,
          message: "مرحباً بعودتك! تم تسجيل الدخول بنجاح" 
        });
      }
      
      // Create new user
      const userData = {
        phoneNumber: cleanPhoneNumber,
        name: cleanName,
        location: cleanLocation,
        avatar: null,
        isOnline: true,
        isAdmin: process.env.NODE_ENV === 'development', // Make users admin in development
      };
      
      console.log("📋 Creating new user with parsed data:", userData);
      
      // Validate with schema
      const validatedUserData = insertUserSchema.parse(userData);
      
      user = await storage.createUser(validatedUserData);
      console.log("✅ User created successfully:", user.id);
      
      // Create session
      const token = randomUUID();
      const sessionData = insertSessionSchema.parse({
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });
      
      await storage.createSession(sessionData);
      console.log("🔑 Session created for new user:", user.id);
      
      res.json({ 
        success: true, 
        user, 
        token,
        message: "تم إنشاء حسابك بنجاح! مرحباً بك في BizChat" 
      });
    } catch (error: any) {
      console.error('❌ User creation error details:', {
        error: error.message,
        stack: error.stack,
        code: error.code,
        constraint: error.constraint,
        phoneNumber: req.body?.phoneNumber
      });
      
      // Handle specific database errors
      if (error.code === '23505') {
        if (error.constraint?.includes('phone_number') || error.constraint?.includes('phoneNumber')) {
          return res.status(400).json({ 
            success: false,
            message: "رقم الهاتف مستخدم بالفعل" 
          });
        }
      }
      
      // Handle validation errors
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          success: false,
          message: "البيانات المدخلة غير صحيحة",
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
      
      // Generic error response
      res.status(500).json({ 
        success: false,
        message: "حدث خطأ أثناء إنشاء الحساب، يرجى المحاولة مرة أخرى",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Development endpoint to get last OTP
  app.get("/api/dev/last-otp", (req, res) => {
    if (process.env.NODE_ENV && process.env.NODE_ENV !== 'development') {
      return res.status(404).json({ message: "Not found" });
    }
    const lastOtp = (global as any).lastOtp;
    if (lastOtp && Date.now() - lastOtp.timestamp < 300000) { // 5 minutes
      res.json({ code: lastOtp.code, phoneNumber: lastOtp.phoneNumber });
    } else {
      res.json({ code: null });
    }
  });

  // Development endpoint to promote current user to admin
  app.post("/api/dev/make-admin", requireAuth, async (req: any, res) => {
    if (process.env.NODE_ENV !== 'development') {
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

  // Development endpoint to promote any user by phone number to admin  
  app.post("/api/dev/make-admin-by-phone", async (req: any, res) => {
    if (process.env.NODE_ENV !== 'development') {
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

  // Delete User Account
  app.delete("/api/user/delete-account", requireAuth, async (req: any, res) => {
    try {
      const success = await storage.deleteUser(req.userId);
      
      if (!success) {
        return res.status(500).json({ message: "فشل في حذف الحساب" });
      }
      
      res.json({ message: "تم حذف الحساب بنجاح" });
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({ message: "فشل في حذف الحساب" });
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

  // Get unread messages count
  app.get("/api/chats/unread-count", requireAuth, async (req: any, res) => {
    try {
      const chats = await storage.getUserChats(req.userId);
      let totalUnreadCount = 0;
      
      for (const chat of chats) {
        const messages = await storage.getChatMessages(chat.id);
        const unreadCount = messages.filter(msg => 
          !msg.isRead && msg.senderId !== req.userId
        ).length;
        totalUnreadCount += unreadCount;
      }
      
      res.json({ unreadCount: totalUnreadCount });
    } catch (error) {
      res.status(500).json({ message: "Failed to get unread count" });
    }
  });

  // Get recent unread messages with sender details for notifications
  app.get("/api/chats/recent-messages", requireAuth, async (req: any, res) => {
    try {
      const chats = await storage.getUserChats(req.userId);
      const recentMessages: Array<{id: string, senderId: string, senderName: string, content: string, chatId: string}> = [];
      
      for (const chat of chats) {
        const messages = await storage.getChatMessages(chat.id);
        const unreadMessages = messages.filter(msg => 
          !msg.isRead && msg.senderId !== req.userId
        );
        
        // أخذ آخر 3 رسائل غير مقروءة من كل محادثة
        const recentUnread = unreadMessages.slice(-3);
        
        for (const message of recentUnread) {
          const sender = await storage.getUser(message.senderId);
          if (sender) {
            recentMessages.push({
              id: message.id,
              senderId: message.senderId,
              senderName: sender.name,
              content: message.content || (message.messageType === 'image' ? 'صورة' : 
                       message.messageType === 'audio' ? 'رسالة صوتية' : 'رسالة'),
              chatId: message.chatId
            });
          }
        }
      }
      
      // ترتيب حسب الأحدث وأخذ آخر 5 رسائل
      const sortedMessages = recentMessages.slice(-5);
      
      res.json(sortedMessages);
    } catch (error) {
      res.status(500).json({ message: "Failed to get recent messages" });
    }
  });

  // Create or get existing chat with another user
  app.post("/api/chats/start", requireAuth, async (req: any, res) => {
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

      console.log('Creating story with data:', req.body);
      console.log('User location:', currentUser.location);

      const storyData = insertStorySchema.parse({
        ...req.body,
        userId: req.userId,
        location: currentUser.location, // Use user's location
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      });
      
      console.log('Parsed story data:', storyData);
      
      const story = await storage.createStory(storyData);
      console.log('Story created successfully:', story.id);
      res.json(story);
    } catch (error) {
      console.error("Error creating story:", error);
      res.status(500).json({ 
        message: "Failed to create story", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
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

  // Story Likes endpoints
  app.post("/api/stories/:storyId/like", requireAuth, async (req: any, res) => {
    try {
      const { storyId } = req.params;
      const { reactionType } = req.body;
      
      // Check if story exists
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

  app.delete("/api/stories/:storyId/like", requireAuth, async (req: any, res) => {
    try {
      const { storyId } = req.params;
      
      // Check if story exists
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

  app.get("/api/stories/:storyId/likes", requireAuth, async (req: any, res) => {
    try {
      const { storyId } = req.params;
      
      // Check if story exists
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
        hasUserLiked,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get story likes" });
    }
  });

  // Story Comments endpoints
  app.post("/api/stories/:storyId/comments", requireAuth, async (req: any, res) => {
    try {
      const { storyId } = req.params;
      const { content } = req.body;
      
      // Check if story exists
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
        content: content.trim(),
      });
      
      const comment = await storage.addStoryComment(commentData);
      const user = await storage.getUser(req.userId);
      res.json({ ...comment, user });
    } catch (error) {
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  app.get("/api/stories/:storyId/comments", requireAuth, async (req: any, res) => {
    try {
      const { storyId } = req.params;
      
      // Check if story exists
      const story = await storage.getStory(storyId);
      if (!story) {
        return res.status(404).json({ message: "Story not found" });
      }
      
      const comments = await storage.getStoryComments(storyId);
      const commentCount = await storage.getStoryCommentCount(storyId);
      
      res.json({
        comments,
        count: commentCount,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get story comments" });
    }
  });

  app.put("/api/stories/:storyId/comments/:commentId", requireAuth, async (req: any, res) => {
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
      
      // Check if user owns the comment
      if (updatedComment.userId !== req.userId) {
        return res.status(403).json({ message: "Not authorized to edit this comment" });
      }
      
      const user = await storage.getUser(updatedComment.userId);
      res.json({ ...updatedComment, user });
    } catch (error) {
      res.status(500).json({ message: "Failed to update comment" });
    }
  });

  app.delete("/api/stories/:storyId/comments/:commentId", requireAuth, async (req: any, res) => {
    try {
      const { commentId } = req.params;
      
      // First get the comment to check ownership
      const comments = await storage.getStoryComments(req.params.storyId);
      const comment = comments.find(c => c.id === commentId);
      
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      // Check if user owns the comment
      if (comment.userId !== req.userId) {
        return res.status(403).json({ message: "Not authorized to delete this comment" });
      }
      
      await storage.deleteStoryComment(commentId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete comment" });
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
      console.log("Store creation request:", req.body);
      console.log("User ID:", req.userId);
      
      // Check if user already has a store
      const existingStore = await storage.getUserStore(req.userId);
      if (existingStore) {
        console.log("User already has store:", existingStore.id);
        return res.status(400).json({ message: "User already has a store" });
      }

      const storeData = insertStoreSchema.parse({
        ...req.body,
        userId: req.userId,
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
      res.json(product);
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
        buyerId: req.userId,
      });

      const orderItems = items.map((item: any) => insertOrderItemSchema.parse(item));
      
      console.log("Parsed order data:", orderData);
      console.log("Parsed order items:", orderItems);

      const createdOrder = await storage.createOrder(orderData, orderItems);
      
      // Clear cart after successful order
      await storage.clearCart(req.userId);
      
      console.log("Order created successfully:", createdOrder.id);
      res.json(createdOrder);
    } catch (error) {
      console.error("Order creation error:", error);
      
      // More specific error handling
      if (error instanceof Error) {
        if (error.message.includes('validation') || error.name === 'ZodError') {
          return res.status(400).json({ 
            message: "Invalid order data", 
            details: error.message 
          });
        }
      }
      
      res.status(500).json({ 
        message: "Failed to create order", 
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined 
      });
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

  // ======================
  // ADMIN ROUTES
  // ======================

  // Admin credentials are now stored in admin.json file - no setup needed

  // Admin Login with Email and Password
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "البريد الإلكتروني وكلمة المرور مطلوبان" });
      }
      
      // استخدام مدير الإدارة الجديد
      const adminManager = new AdminManager(storage);
      
      // التحقق من صحة بيانات الدخول
      if (!adminManager.validateCredentials(email, password)) {
        return res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
      }
      
      console.log(`Admin login successful for: ${email}`);
      
      // العثور على مستخدم الإدارة أو إنشاؤه
      const adminUser = await adminManager.ensureAdminUser();
      
      if (!adminUser) {
        return res.status(500).json({ message: "فشل في إنشاء أو العثور على مستخدم الإدارة" });
      }
      
      // إنشاء البيانات التجريبية إذا لزم الأمر
      await adminManager.createSampleDataIfNeeded();
      
      // تحديث وقت آخر تسجيل دخول
      adminManager.updateLastLogin();
      
      // Create session
      const sessionData = {
        userId: adminUser!.id,
        token: `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      };
      const session = await storage.createSession(sessionData);
      
      res.json({
        token: session.token,
        user: adminUser,
        message: "تم تسجيل الدخول بنجاح"
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "خطأ في الخادم. حاول مرة أخرى." });
    }
  });

  // Admin Dashboard Statistics
  app.get("/api/admin/dashboard-stats", requireAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getAdminDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get dashboard stats" });
    }
  });

  // Admin Verification Management
  app.get("/api/admin/verification-requests", requireAdmin, async (req: any, res) => {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      const requests = await storage.getAllVerificationRequests(status as string);
      
      // Simple pagination
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

  // Admin Orders Management
  app.get("/api/admin/orders", requireAdmin, async (req: any, res) => {
    try {
      const { status, search, page = 1, limit = 50 } = req.query;
      const orders = await storage.getAllOrders();
      
      // Filter orders
      let filteredOrders = orders;
      if (status && status !== 'all') {
        filteredOrders = filteredOrders.filter(order => order.status === status);
      }
      if (search) {
        filteredOrders = filteredOrders.filter(order => 
          order.id.includes(search as string) ||
          order.customerName.toLowerCase().includes((search as string).toLowerCase()) ||
          order.customerPhone.includes(search as string)
        );
      }
      
      // Simple pagination
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

  app.put("/api/admin/orders/:orderId/status", requireAdmin, async (req: any, res) => {
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

  // Approve/Reject Verification Request
  app.put("/api/admin/verification-requests/:requestId", requireAdmin, async (req: any, res) => {
    try {
      const { requestId } = req.params;
      const { status, adminNote } = req.body;
      
      if (!['approved', 'rejected'].includes(status)) {
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

  // Admin User Management
  app.get("/api/admin/users", requireAdmin, async (req: any, res) => {
    try {
      const { page = 1, limit = 20, search, isVerified, isAdmin } = req.query;
      const users = await storage.getAllUsers();
      
      // Filter users
      let filteredUsers = users;
      
      if (search) {
        const searchTerm = search.toString().toLowerCase();
        filteredUsers = users.filter(user => 
          user.name.toLowerCase().includes(searchTerm) || 
          user.phoneNumber.includes(searchTerm)
        );
      }
      
      if (isVerified !== undefined) {
        filteredUsers = filteredUsers.filter(user => 
          user.isVerified === (isVerified === 'true')
        );
      }
      
      if (isAdmin !== undefined) {
        filteredUsers = filteredUsers.filter(user => 
          user.isAdmin === (isAdmin === 'true')
        );
      }
      
      // Simple pagination
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

  // Toggle User Admin Status
  app.put("/api/admin/users/:userId/admin", requireAdmin, async (req: any, res) => {
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

  // Toggle User Verification Status
  app.put("/api/admin/users/:userId/verify", requireAdmin, async (req: any, res) => {
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

  // Admin Store Management
  app.get("/api/admin/stores", requireAdmin, async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const stores = await storage.getAllStores();
      
      // Filter by status
      let filteredStores = stores;
      if (status) {
        filteredStores = stores.filter(store => store.status === status);
      }
      
      // Simple pagination
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

  // Approve/Reject Store
  app.put("/api/admin/stores/:storeId/status", requireAdmin, async (req: any, res) => {
    try {
      const { storeId } = req.params;
      const { status, rejectionReason } = req.body;
      
      if (!['approved', 'rejected', 'suspended'].includes(status)) {
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

  // Admin Orders Management
  app.get("/api/admin/orders", requireAdmin, async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const orders = await storage.getAllOrders();
      
      // Filter by status
      let filteredOrders = orders;
      if (status) {
        filteredOrders = orders.filter(order => order.status === status);
      }
      
      // Simple pagination
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

  // Admin Credentials Update
  app.post("/api/admin/update-credentials", requireAdmin, async (req: any, res) => {
    try {
      const { currentPassword, newEmail, newPassword } = req.body;
      
      if (!currentPassword || !newEmail || !newPassword) {
        return res.status(400).json({ message: "جميع الحقول مطلوبة" });
      }
      
      // Verify current password against stored or environment credentials
      const storedCredentials = await storage.getAdminCredentials();
      const currentAdminPassword = storedCredentials?.password || process.env.ADMIN_PASSWORD;
      
      if (!currentAdminPassword) {
        return res.status(500).json({ message: "إعدادات الإدارة غير مكتملة" });
      }
      
      if (currentPassword !== currentAdminPassword) {
        return res.status(401).json({ message: "كلمة المرور الحالية غير صحيحة" });
      }
      
      // Update stored credentials
      await storage.updateAdminCredentials({
        email: newEmail,
        password: newPassword
      });
      
      // Success message
      res.json({ 
        message: "تم تحديث البيانات بنجاح! يمكنك الآن استخدام الإيميل وكلمة المرور الجديدة لتسجيل الدخول.",
        newEmail,
        note: "تم حفظ البيانات الجديدة بنجاح"
      });
    } catch (error) {
      res.status(500).json({ message: "فشل في تحديث بيانات الاعتماد" });
    }
  });

  // ===========================
  // Additional Admin API Routes
  // ===========================

  // Admin Dashboard Stats
  app.get("/api/admin/dashboard-stats", requireAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getAdminDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get dashboard stats" });
    }
  });

  // Admin Users Management
  app.get("/api/admin/users", requireAdmin, async (req: any, res) => {
    try {
      const { search, isVerified, isAdmin, page = 1, limit = 50 } = req.query;
      let users = await storage.getAllUsers();
      
      // Filter by search term
      if (search) {
        const searchTerm = search.toString().toLowerCase();
        users = users.filter(user => 
          user.name.toLowerCase().includes(searchTerm) ||
          user.phoneNumber.includes(searchTerm)
        );
      }
      
      // Filter by verification status
      if (isVerified !== undefined) {
        const isVerifiedBool = isVerified === 'true';
        users = users.filter(user => user.isVerified === isVerifiedBool);
      }
      
      // Filter by admin status
      if (isAdmin !== undefined) {
        const isAdminBool = isAdmin === 'true';
        users = users.filter(user => user.isAdmin === isAdminBool);
      }
      
      // Simple pagination
      const startIndex = (Number(page) - 1) * Number(limit);
      const endIndex = startIndex + Number(limit);
      const paginatedUsers = users.slice(startIndex, endIndex);
      
      res.json({
        users: paginatedUsers,
        total: users.length,
        page: Number(page),
        totalPages: Math.ceil(users.length / Number(limit))
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  // Toggle User Admin Status
  app.put("/api/admin/users/:userId/admin", requireAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { isAdmin } = req.body;
      
      if (typeof isAdmin !== 'boolean') {
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

  // Toggle User Verification Status
  app.put("/api/admin/users/:userId/verify", requireAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { isVerified } = req.body;
      
      if (typeof isVerified !== 'boolean') {
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

  // Admin Verification Requests Management
  app.get("/api/admin/verification-requests", requireAdmin, async (req: any, res) => {
    try {
      const { status, page = 1, limit = 50 } = req.query;
      let requests = await storage.getAllVerificationRequests(status ? status.toString() : undefined);
      
      // Simple pagination
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

  // Update Verification Request Status
  app.put("/api/admin/verification-requests/:requestId", requireAdmin, async (req: any, res) => {
    try {
      const { requestId } = req.params;
      const { status, adminNote } = req.body;
      
      if (!['approved', 'rejected'].includes(status)) {
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

  // Stickers routes
  app.get('/api/stickers', async (req, res) => {
    try {
      const stickers = await storage.getAllStickers();
      res.json(stickers);
    } catch (error) {
      console.error('Error fetching stickers:', error);
      res.status(500).json({ error: 'Failed to fetch stickers' });
    }
  });

  app.get('/api/stickers/category/:category', async (req, res) => {
    try {
      const { category } = req.params;
      const stickers = await storage.getStickersByCategory(category);
      res.json(stickers);
    } catch (error) {
      console.error('Error fetching stickers by category:', error);
      res.status(500).json({ error: 'Failed to fetch stickers' });
    }
  });

  // ======================
  // FEATURE MANAGEMENT API
  // ======================

  // Get all features (public endpoint for app to check enabled features)
  app.get('/api/features', async (req: any, res: any) => {
    try {
      const features = await storage.getAllFeatures();
      res.json(features);
    } catch (error) {
      console.error('Get features error:', error);
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  // Get single feature status
  app.get('/api/features/:featureId', async (req: any, res: any) => {
    try {
      const { featureId } = req.params;
      const feature = await storage.getFeature(featureId);
      
      if (!feature) {
        return res.status(404).json({ message: "الميزة غير موجودة" });
      }
      
      res.json(feature);
    } catch (error) {
      console.error('Get feature error:', error);
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  // Update feature status (admin only)
  app.put('/api/admin/features/:featureId', requireAdmin, async (req: any, res: any) => {
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
        return res.status(404).json({ message: "الميزة غير موجودة" });
      }

      res.json({
        message: `تم ${isEnabled ? 'تفعيل' : 'إيقاف'} الميزة بنجاح`,
        feature
      });
    } catch (error) {
      console.error('Update feature error:', error);
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  // Get all features for admin management
  app.get('/api/admin/features', requireAdmin, async (req: any, res: any) => {
    try {
      const features = await storage.getAllFeatures();
      res.json(features);
    } catch (error) {
      console.error('Get admin features error:', error);
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
