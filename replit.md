# BizChat

## Overview

BizChat is a full-stack business messaging application built with React, TypeScript, and Express. It integrates messaging with commerce features, offering a responsive UI for business communication and trade. Key capabilities include individual and group chats, product promotion via stories/status updates, message status tracking (sent, delivered, read), and Arabic language support for Middle Eastern markets.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Frameworks**: React with TypeScript, Vite for fast builds.
- **Routing**: Wouter for client-side navigation.
- **State Management**: TanStack Query for server state, React hooks for local component state.
- **Styling**: Tailwind CSS for responsive design, Shadcn/ui for accessible UI components.
- **Theming**: Dark/light mode support with system preference detection.

### Backend Architecture
- **Framework**: Express.js with TypeScript for RESTful APIs.
- **Database Interaction**: Drizzle ORM for PostgreSQL schema definitions (users, chats, messages).
- **Storage**: In-memory storage for development; PostgreSQL for production.
- **Session Management**: Express session handling with PostgreSQL session store.

### Database Design
- **Users Table**: Stores user profiles, online status, and last seen timestamps.
- **Chats Table**: Manages individual and group chat containers, including participant lists.
- **Messages Table**: Stores message content, type (text, image, file), and tracks read/delivery status.

### API Design
- **Approach**: RESTful endpoints using standard HTTP methods for CRUD operations.
- **Structure**: Resource-based URLs (e.g., `/api/user/current`, `/api/chats`).
- **Data Format**: JSON for requests and responses, including error handling.

### UI/UX Design Patterns
- **Responsiveness**: Mobile-first approach with adaptable layouts.
- **Modularity**: Reusable UI components with variant-based styling.
- **Accessibility**: Support for screen readers and keyboard navigation.
- **Inspiration**: Familiar chat interface inspired by WhatsApp, featuring message bubbles, status indicators, and a sidebar.

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless driver.
- **drizzle-orm**: Type-safe ORM.
- **drizzle-kit**: Database migration and schema management.

### UI Component Libraries
- **@radix-ui/***: Accessible UI primitives.
- **@tanstack/react-query**: Server state management and data fetching.
- **class-variance-authority**: Utility for component variant styling.
- **cmdk**: Command palette and search functionality.
- **embla-carousel-react**: Touch-friendly carousel.

### Development Tools
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay for Replit.
- **@replit/vite-plugin-cartographer**: Replit-specific development tooling.
- **tsx**: TypeScript execution for Node.js.

### Styling and Icons
- **tailwindcss**: Utility-first CSS framework.
- **lucide-react**: Modern icon library.
- **date-fns**: Date formatting and manipulation.

### Form and Validation
- **@hookform/resolvers**: Integration with validation libraries.
- **react-hook-form**: Performant form library.
- **zod**: TypeScript-first schema validation.

### Session Management
- **connect-pg-simple**: PostgreSQL session store for Express.
- **express-session**: Server-side session management middleware.

## Recent Changes

### September 29, 2025 - Fresh GitHub Clone Import Setup
- ✅ Successfully cloned project from GitHub repository
- ✅ Verified all dependencies are properly installed (React, Express, TypeScript, Tailwind, etc.)
- ✅ Confirmed Replit environment configuration:
  - Frontend properly configured with host "0.0.0.0" on port 5000
  - Vite server configured with `allowedHosts: true` for Replit proxy compatibility
  - Backend Express server listening on "0.0.0.0:5000" with CORS allowing all origins
  - SSL certificate verification disabled for development
- ✅ Workflow configured and running successfully:
  - "Start application" workflow running `npm run dev`
  - Server started on port 5000 with webview output type
  - Application accessible through Replit preview
- ✅ Deployment configuration verified:
  - Autoscale deployment target configured
  - Build command: `npm run build`
  - Start command: `npm run start`
- ✅ Application initialization confirmed:
  - MemStorage active with 870 default stickers across 13 categories
  - Admin user created (المدير العام - admin@bizchat.com)
  - 8 vendor categories, 3 service categories, 12 product categories initialized
  - Daily missions and all features loaded successfully
- ✅ Application verified working with Arabic UI login screen displayed
- 🔧 Note: TypeScript errors exist in server/storage.ts but do not affect runtime functionality with MemStorage

### September 29, 2025 - Critical Navigation Fixes for User Profiles (Previous Session)
- ✅ Fixed broken navigation from notifications to user profiles:
  - Corrected routing path in notifications list from `/profile/${userId}` to `/user-profile/${userId}`
  - Resolved issue where clicking notification senders led to "user not found" error
  - Users can now successfully navigate from notification bell to sender profiles
- ✅ Fixed navigation issue in social feed post cards:
  - Enhanced "Visit Profile" button with proper event handling (preventDefault/stopPropagation)
  - Prevented parent click handlers from hijacking navigation flow
  - Improved user experience when viewing profiles from Instagram-style post cards
- ✅ Code quality improvements:
  - Removed unnecessary console logging statements
  - Ensured consistent routing patterns across all components
  - Architect review confirmed no regressions or side effects
- ✅ Testing verified:
  - Both navigation paths work correctly without browser console errors
  - Modal dialogs close properly when navigating to user profiles
  - Consistent user experience across all profile access points

### September 29, 2025 - Enhanced Notifications and Follow System (Earlier)
- ✅ Fixed critical navigation issue from notifications to user profiles:
  - Corrected routing path from `/profile/${userId}` to `/user-profile/${userId}`
  - Users can now successfully navigate from notifications bell to sender's profile
  - Resolved "user not found" error when clicking on notification senders
- ✅ Implemented real-time follower count updates:
  - Enhanced followMutation with comprehensive cache invalidation
  - Immediate updates to follower/following counts across all UI components
  - Added notification system refresh when following/unfollowing users
  - Optimized query invalidation for better performance (followers, following, stats, notifications)
- ✅ Improved user experience with instant feedback:
  - Follow/unfollow actions now reflect immediately in profile statistics
  - Notification bell updates automatically when new follow notifications arrive
  - Seamless modal closure and navigation flow between notifications and profiles
- ✅ Architecture review confirmed all changes follow best practices:
  - Proper query key segmentation prevents unnecessary API calls
  - Bounded refetch scope maintains good performance
  - Authenticated API endpoints ensure security compliance

### September 29, 2025 - Notifications System Enhancement (Earlier)
- ✅ Fixed critical notifications button functionality issue reported by user
- ✅ Added comprehensive NotificationsSettingsModal component with Arabic UI:
  - Sound settings with volume control and test functionality
  - Browser notifications toggle
  - Push notifications preferences
  - Granular notification type controls (messages, groups, social updates, orders)
  - LocalStorage persistence for user preferences
- ✅ Enhanced bottom navigation with dedicated notifications button:
  - Interactive bell icon with unread count badge
  - Proper click handler opening settings dialog
  - Resolved previous freeze/non-responsive behavior
- ✅ Fixed accessibility issues in DialogContent components:
  - Added missing DialogTitle to CommandDialog for screen reader support
  - Improved overall UI accessibility compliance
- ✅ All changes verified working without console errors or functionality issues

### September 28, 2025 - Complete Replit Environment Setup
- ✅ Successfully imported project from GitHub and configured for Replit environment
- ✅ Verified full-stack application architecture (React frontend + Express backend)
- ✅ Configured proper host settings for Replit proxy compatibility:
  - Frontend: host "0.0.0.0" on port 5000 with webview output type
  - Backend: server listening on "0.0.0.0:5000" with CORS allowing all origins
  - SSL certificate verification disabled for development environment
- ✅ Set up development workflow with proper webview configuration
- ✅ Configured deployment settings for autoscale production deployment with npm build/start
- ✅ Application running successfully with all features initialized:
  - MemStorage with persistent session data and live admin user creation
  - Admin user auto-created (المدير العام - admin@bizchat.com)
  - 870 default stickers loaded across 13 categories
  - 8 vendor categories with 4 sample vendors initialized
  - 3 service categories with 3 sample services
  - 12 product categories and daily missions
  - All safety systems, error handling, and runtime fixes active
- ✅ Verified application accessibility through Replit proxy with Arabic UI support
- ✅ All dependencies installed and working correctly (React, Express, TypeScript, Tailwind, etc.)

## Project Status
- **Development**: ✅ Fully functional in Replit environment with live preview at port 5000
- **Deployment**: ✅ Configured for autoscale deployment (npm run build → npm start)
- **Database**: Using MemStorage for development (PostgreSQL ready for production)
- **Admin Access**: Available via admin.json configuration (admin@bizchat.com)
- **Features**: Business chat, commerce integration, Arabic language support
- **UI/UX**: Mobile-responsive with WhatsApp-inspired interface and green theme
- **Import Status**: ✅ **COMPLETE** - Ready for development and deployment
- **Frontend**: React + TypeScript + Tailwind CSS with Arabic RTL support
- **Backend**: Express.js + Drizzle ORM with CORS configured for all origins
- **Host Configuration**: Frontend and backend properly configured for Replit proxy (0.0.0.0:5000)