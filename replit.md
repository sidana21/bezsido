# BizChat

## Overview

A full-stack business messaging application built with React, TypeScript, and Express. BizChat combines messaging functionality with commerce features, providing a modern, responsive UI for business communication and trade. The application supports individual and group chats, stories/status updates for product promotion, message status tracking (sent, delivered, read), and includes Arabic language support for Middle Eastern markets.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### September 26, 2025 - CRITICAL AUTHENTICATION ENDPOINT FIX ✅
- **FIXED: Duplicate login endpoints causing authentication conflicts**: Resolved the duplicate `/api/auth/login` endpoints in `server/routes.ts` that were causing login failures
- **Removed endpoint duplication**: Deleted the conflicting second `/api/auth/login` endpoint (lines 806-880) and kept the primary one (line 303)
- **Password verification restored**: Login system now works correctly with proper bcrypt password comparison and validation
- **Authentication flow stabilized**: Users can now successfully login after logout without encountering false password verification errors
- **Root cause**: Two identical `/api/auth/login` endpoints were defined in the same route file, causing Express.js routing conflicts and unpredictable authentication behavior

### September 26, 2025 - CRITICAL DATABASE SCHEMA FIX ✅
- **FIXED: Missing password column in users table**: Resolved the database schema mismatch that was preventing user registration on Render deployment
- **Schema synchronization fix**: Added missing `password TEXT` column to users table creation SQL in `server/db.ts`
- **Backward compatibility**: Added `ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT` to handle existing databases
- **Drizzle schema push**: Successfully synchronized schema using `npm run db:push` command
- **Error resolved**: Fixed "عمود كلمة المرور الخاص بالعلاقة المستخدمين غير موجود" (password column does not exist) error
- **Production compatibility**: This fix ensures user registration works on all deployment platforms (Render, Vercel, Netlify)
- **Root cause**: Schema definition in `shared/schema.ts` included password field but table creation SQL in `server/db.ts` was missing it

### September 26, 2025 - Render Deployment Authentication Fix ✅
- **CRITICAL FIX: Removed OTP dependency for Render deployment**: Eliminated all OTP_DISABLED environment variable checks that were preventing authentication on Render
- **Password-only authentication system now active**: Users can now register and login with email/password without any OTP verification requirements
- **Authentication endpoints cleaned**: Removed blocking conditions in `/api/auth/login` and `/api/auth/register` that required OTP_DISABLED=true environment variable
- **Render deployment compatibility restored**: Application now works on Render without needing special environment variables for authentication
- **User preference respected**: Completely removed OTP system as requested - no verification codes required for any authentication flow

### September 26, 2025 - Fresh GitHub Import Setup Complete ✅
- **Successfully imported and configured fresh GitHub clone**: BizChat application now fully operational in Replit environment (VERIFIED WORKING)
- **Gmail email service configured**: Secure Gmail SMTP integration working with environment variables (GMAIL_USER, GMAIL_APP_PASSWORD)
- **Email functionality verified**: OTP verification emails sending successfully through Gmail service
- **Workflow properly configured**: Frontend serving on port 5000 with webview output and proper host configuration (0.0.0.0)
- **Database connectivity established**: PostgreSQL connection verified, all tables created, and data initialized
- **Application systems initialized**: All core features loaded including:
  - Admin user management (المدير العام created successfully)
  - 82 default stickers across 5 categories  
  - Daily missions system
  - Default app features and configuration
- **Security systems active**: Data protection mode enabled, SSL configuration set for development
- **Development environment ready**: Application serving successfully with real-time API responses and Arabic interface
- **Deployment configuration set**: VM target configured for stateful chat application with proper build/start scripts

### September 25, 2025 - Previous Replit Environment Setup
- **Successfully configured for Replit environment**: Full-stack application now running properly in Replit
- **Database connection verified**: PostgreSQL database connection established and all tables created/verified
- **Workflow configuration**: Properly configured frontend workflow on port 5000 with webview output  
- **Host configuration verified**: Application properly configured with `allowedHosts: true` for Replit proxy support
- **Deployment settings configured**: VM deployment target with proper build and start scripts (changed from autoscale to VM for stateful chat application)
- **Application functionality confirmed**: All core systems initialized including:
  - Admin user management system
  - Default app features initialization (82 free stickers in 5 categories)
  - Daily missions systems
  - SSL certificate handling for development environment
- **Arabic language support confirmed**: UI and system messages properly displaying in Arabic
- **Real-time API endpoints functional**: Feature management and user authentication systems active
- **Screenshot verification**: Application interface loading correctly through Replit webview

### August 30, 2025 - Production Deployment Fixes
- **Fixed deployment compatibility issues**: Resolved all problems preventing deployment on external hosting platforms
- **Removed Replit dependencies**: Cleaned up Replit-specific scripts and dependencies that caused failures
- **Added flexible storage system**: Application now works with or without database (automatic fallback to in-memory storage)
- **Created deployment configurations**: Added configuration files for major hosting platforms:
  - `vercel.json` for Vercel deployment
  - `netlify.toml` for Netlify deployment
  - `render.yaml` for Render deployment
  - `Dockerfile` for containerized deployment
- **Enhanced build system**: Created optimized build script (`scripts/build.js`) for production deployment
- **Added environment configuration**: Created `.env.example` with all required environment variables
- **Created deployment guides**: Added comprehensive documentation (`deployment-guide.md` and `production-fixes.md`)
- **Added fallback server**: Created `server.js` as a simple deployment option for basic hosting

### September 21, 2025 - Authentication Fix for Render Deployment
- **Fixed Render login errors**: Resolved the generic "خطأ في إنشاء الحساب" error with specific error messages
- **Added comprehensive health diagnostics**: New `/api/health` endpoint to diagnose database and system issues on Render
- **Enhanced error handling**: Specific error messages for duplicate phone numbers, database connection issues, missing tables, and validation errors
- **Phone number normalization**: Added consistent phone number formatting across all authentication endpoints to prevent lookup conflicts
- **Security improvements**: Fixed OTP exposure vulnerability and secured direct-login endpoint for development only
- **Database connectivity checks**: Added admin endpoint for database initialization and troubleshooting on deployment platforms

### August 31, 2025 - Data Protection System
- **Disabled automatic sample data creation**: Completely removed all automatic generation of test/sample users to protect real user data
- **Fixed user data persistence**: Ensured all real user registrations are permanently stored and never overwritten
- **Prevented test data interference**: Removed createSampleDataIfNeeded() calls from admin login flow
- **Database integrity protection**: Added safeguards to prevent accidental data loss during system restarts

### August 25, 2025 - Major Fixes & Error Prevention System
- **Created comprehensive error prevention system**: Added 5 utility files to prevent recurring issues
  - `client/src/utils/error-handling.ts`: Safe function execution and DOM operations
  - `client/src/utils/dom-cleanup.ts`: Safe event listener and interval management
  - `client/src/utils/audio-recording.ts`: Safe microphone and recording operations
  - `client/src/utils/story-management.ts`: Safe story progress and navigation
  - `client/src/utils/database-fixes.ts`: Secure OTP and database error handling
  - `client/src/utils/app-fixes.ts`: Central exports and developer guidelines
- **Fixed DOM removeChild errors**: Updated ChatArea component to use safe cleanup utilities
- **Fixed StoryViewer interval issues**: Replaced manual intervals with safe progress manager
- **Improved OTP functionality**: Fixed database storage implementation with secure generation
- **Added comprehensive documentation**: Created FIXES_DOCUMENTATION.md with prevention guidelines
- **Enhanced code stability**: All components now use error-safe patterns

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