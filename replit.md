# WhatsApp Clone

## Overview

A full-stack WhatsApp-style messaging application built with React, TypeScript, and Express. The application features real-time chat functionality with a modern, responsive UI that closely mimics WhatsApp's design and user experience. It supports individual and group chats, message status tracking (sent, delivered, read), and includes Arabic language support.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React + TypeScript**: Modern component-based architecture using functional components and hooks
- **Vite**: Fast build tool and development server with hot module replacement
- **React Router (Wouter)**: Lightweight routing solution for client-side navigation
- **TanStack Query**: Server state management for API calls, caching, and background updates
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Shadcn/ui**: High-quality, accessible UI component library built on Radix UI primitives
- **Theme System**: Dark/light mode support with system preference detection

### Backend Architecture
- **Express.js**: RESTful API server with TypeScript support
- **In-Memory Storage**: Mock data storage implementation for development (MemStorage class)
- **Database Schema**: Drizzle ORM with PostgreSQL schema definitions for users, chats, and messages
- **Session Management**: Express session handling with PostgreSQL session store (connect-pg-simple)

### Database Design
- **Users Table**: User profiles with online status and last seen timestamps
- **Chats Table**: Individual and group chat containers with participant lists stored as JSON
- **Messages Table**: Message content with type support (text, image, file), read/delivery status tracking

### State Management
- **Client State**: React hooks (useState, useEffect) for local component state
- **Server State**: TanStack Query for API data fetching, caching, and synchronization
- **Theme State**: Context-based theme provider for dark/light mode persistence

### API Design
- **RESTful Endpoints**: Standard HTTP methods for CRUD operations
- **Resource-based URLs**: `/api/user/current`, `/api/chats`, `/api/chats/:id/messages`
- **JSON Communication**: Structured request/response format with error handling
- **Query Invalidation**: Automatic cache updates after mutations

### UI/UX Design Patterns
- **Mobile-First**: Responsive design with mobile overlay patterns
- **Component Composition**: Reusable UI components with variant-based styling
- **Accessibility**: Screen reader support and keyboard navigation
- **WhatsApp Design Language**: Familiar chat interface with message bubbles, status indicators, and sidebar layout

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL serverless driver for database connectivity
- **drizzle-orm**: Type-safe ORM for database operations and migrations
- **drizzle-kit**: Database migration and schema management tools

### UI Component Libraries
- **@radix-ui/***: Comprehensive set of accessible, unstyled UI primitives
- **@tanstack/react-query**: Server state management and data fetching
- **class-variance-authority**: Component variant styling utility
- **cmdk**: Command palette and search functionality
- **embla-carousel-react**: Touch-friendly carousel component

### Development Tools
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay for Replit environment
- **@replit/vite-plugin-cartographer**: Replit-specific development tooling
- **tsx**: TypeScript execution for Node.js development server

### Styling and Icons
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Modern icon library with consistent design
- **date-fns**: Date formatting and manipulation utilities

### Form and Validation
- **@hookform/resolvers**: React Hook Form integration with validation libraries
- **react-hook-form**: Performant form library with minimal re-renders
- **zod**: TypeScript-first schema validation (used with drizzle-zod)

### Session Management
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **express-session**: Server-side session management middleware