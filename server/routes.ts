import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMessageSchema, insertStorySchema, insertOtpSchema, insertUserSchema, insertSessionSchema } from "@shared/schema";
import { randomUUID } from "crypto";

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

  const httpServer = createServer(app);
  return httpServer;
}
