# BizChat

## Overview

BizChat is a full-stack business messaging application built with React, TypeScript, and Express. Its core purpose is to integrate messaging with commerce features, providing a responsive UI for business communication and trade. Key capabilities include individual and group chats, product promotion via stories/status updates, message status tracking (sent, delivered, read), and robust Arabic language support for Middle Eastern markets. The project aims to offer a complete TikTok-like social media experience integrated with business functionalities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Frameworks**: React with TypeScript, Vite.
- **Routing**: Wouter.
- **State Management**: TanStack Query for server state, React hooks for local state.
- **Styling**: Tailwind CSS for responsive design, Shadcn/ui for accessible components.
- **Theming**: Dark/light mode support.
- **UI/UX**: Mobile-first, modular design with reusable components, accessibility features. WhatsApp-inspired chat interface and TikTok-style social feed with snap scrolling, auto-playing videos, and interactive elements (likes, comments, shares).

### Backend
- **Framework**: Express.js with TypeScript.
- **Database Interaction**: Drizzle ORM for PostgreSQL.
- **Storage**: In-memory for development; PostgreSQL for production.
- **Session Management**: Express session handling with PostgreSQL session store.

### Database Design
- **Tables**: Users (profiles, status), Chats (containers, participants), Messages (content, type, status).

### API Design
- **Approach**: RESTful endpoints using standard HTTP methods.
- **Data Format**: JSON for requests and responses.

### Technical Implementations
- Full TikTok-style social media interface for posts, including vertical snap scrolling, auto-playing videos, pulsing interaction buttons, flying hearts animation, and enhanced share functionality.
- Comprehensive notification system with settings modal, unread counts, and granular controls.
- Real-time follower count updates with robust cache invalidation.
- Arabic UI and RTL layout support across all components.

## External Dependencies

### Core Framework & Database
- `@neondatabase/serverless`: PostgreSQL serverless driver.
- `drizzle-orm`: Type-safe ORM.
- `drizzle-kit`: Database migration and schema management.
- `connect-pg-simple`: PostgreSQL session store for Express.
- `express-session`: Server-side session management middleware.

### UI & State Management
- `@radix-ui/*`: Accessible UI primitives.
- `@tanstack/react-query`: Server state management and data fetching.
- `class-variance-authority`: Component variant styling.
- `cmdk`: Command palette and search.
- `embla-carousel-react`: Touch-friendly carousel.

### Development Tools (Replit Specific)
- `@replit/vite-plugin-runtime-error-modal`: Development error overlay.
- `@replit/vite-plugin-cartographer`: Replit-specific tooling.
- `tsx`: TypeScript execution for Node.js.

### Styling, Icons & Utilities
- `tailwindcss`: Utility-first CSS framework.
- `lucide-react`: Modern icon library.
- `date-fns`: Date formatting and manipulation.

### Form & Validation
- `@hookform/resolvers`: Integration with validation libraries.
- `react-hook-form`: Performant form library.
- `zod`: TypeScript-first schema validation.

## Replit Environment Setup

### Date
- Configured: September 30, 2025

### Development Configuration
- **Port**: 5000 (frontend and backend on same port)
- **Host**: 0.0.0.0 (configured for Replit proxy)
- **Workflow**: "Start application" runs `npm run dev`
- **Output Type**: webview for frontend preview
- **Database**: PostgreSQL (Replit managed) - DATABASE_URL configured
- **Storage Mode**: In-memory (MemStorage) for development

### Deployment Configuration
- **Type**: Autoscale (stateless web app)
- **Build**: `npm run build`
- **Run**: `npm run start`
- **Production Mode**: Serves static files from dist/public

### Key Files
- **Server Entry**: `server/index.ts` - Express server with Vite integration
- **Vite Config**: `vite.config.ts` - Already configured with `allowedHosts: true` for Replit proxy
- **Schema**: `shared/schema.ts` - Drizzle ORM schema definitions
- **Storage**: `server/storage.ts` - Storage interface (MemStorage/DatabaseStorage)

### Known Items
- TypeScript errors exist in storage.ts (158 diagnostics) but don't prevent runtime execution
- Notification sound loading error (uses fallback ringtone) - cosmetic only
- App successfully loads with Arabic RTL support and login screen