import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMessageSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get current user (for simplicity, always return the current user)
  app.get("/api/user/current", async (req, res) => {
    try {
      const user = await storage.getUser("current-user");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Get user chats
  app.get("/api/chats", async (req, res) => {
    try {
      const chats = await storage.getUserChats("current-user");
      
      // Add last message and unread count to each chat
      const chatsWithDetails = await Promise.all(
        chats.map(async (chat) => {
          const messages = await storage.getChatMessages(chat.id);
          const lastMessage = messages[messages.length - 1] || null;
          const unreadCount = messages.filter(msg => 
            msg.senderId !== "current-user" && !msg.isRead
          ).length;
          
          // Get other participant info for individual chats
          let otherParticipant = null;
          if (!chat.isGroup && chat.participants.length === 2) {
            const otherParticipantId = chat.participants.find(id => id !== "current-user");
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
  app.get("/api/chats/:chatId/messages", async (req, res) => {
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
  app.post("/api/chats/:chatId/messages", async (req, res) => {
    try {
      const { chatId } = req.params;
      const messageData = insertMessageSchema.parse({
        ...req.body,
        chatId,
        senderId: "current-user",
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
  app.patch("/api/messages/:messageId/read", async (req, res) => {
    try {
      const { messageId } = req.params;
      await storage.markMessageAsRead(messageId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
