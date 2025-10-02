# BizChat

## Overview

BizChat is a full-stack business messaging application built with React, TypeScript, and Express. It integrates messaging with commerce features, offering a responsive UI for business communication and trade. Key capabilities include individual and group chats, product promotion via stories/status updates, message status tracking, and robust Arabic language support. The project aims to provide a social media experience similar to TikTok, integrated with business functionalities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Frameworks**: React with TypeScript, Vite.
- **Routing**: Wouter.
- **State Management**: TanStack Query for server state, React hooks for local state.
- **Styling**: Tailwind CSS for responsive design, Shadcn/ui for accessible components.
- **Theming**: Dark/light mode support.
- **UI/UX**: Mobile-first, modular design. WhatsApp-inspired chat interface and TikTok-style social feed with snap scrolling, auto-playing videos, and interactive elements.

### Backend
- **Framework**: Express.js with TypeScript.
- **Database Interaction**: Drizzle ORM for PostgreSQL.
- **Storage**: PostgreSQL for production, in-memory for development.
- **Session Management**: Express session handling with PostgreSQL session store.

### Database Design
- **Tables**: Users (profiles, status), Chats (containers, participants), Messages (content, type, status).

### API Design
- **Approach**: RESTful endpoints using standard HTTP methods.
- **Data Format**: JSON.

### Technical Implementations
- Full TikTok-style social media interface with vertical snap scrolling, auto-playing videos, and interactive animations.
- Comprehensive notification system with settings, unread counts, and granular controls.
- Real-time follower count updates with cache invalidation.
- Arabic UI and RTL layout support across all components.
- Profile page displays unified grid of user posts and products.
- Services page features horizontal scrolling category cards with gradient designs and animations.
- Redesigned service categories with circular pulsing designs and interactive hover animations.
- Auto-initialization system for product categories (8 default categories: Electronics, Fashion, Home & Garden, Food & Beverages, Beauty & Health, Sports, Books, Toys) - similar to vendor categories initialization.
- Product and service delete functionality with owner-only access control and confirmation dialogs.

### Admin Panel Features
- **Comprehensive Dashboard Statistics**: Real-time monitoring of users, stores, orders, revenue, and verification requests.
- **User Management System**: Block/unblock functionality, post count tracking, detailed user information.
- **Real-time Notification System**: Visual indicators, pulsing badges for pending verification requests, recent activities feed.
- **Sound Alert System**: Automatic audio notifications for new verification requests with debouncing.
- **Admin Announcements System**: Dedicated page for sending announcements to all users, displayed with distinctive styling in user notifications.
- **API Endpoints**: Dedicated endpoints for dashboard stats, activities, user management, and announcements.

## External Dependencies

### Core Framework & Database
- `@neondatabase/serverless`: PostgreSQL serverless driver.
- `drizzle-orm`: Type-safe ORM.
- `drizzle-kit`: Database migration and schema management.
- `connect-pg-simple`: PostgreSQL session store.
- `express-session`: Server-side session management.

### UI & State Management
- `@radix-ui/*`: Accessible UI primitives.
- `@tanstack/react-query`: Server state management and data fetching.
- `class-variance-authority`: Component variant styling.
- `cmdk`: Command palette and search.
- `embla-carousel-react`: Touch-friendly carousel.

### Styling, Icons & Utilities
- `tailwindcss`: Utility-first CSS framework.
- `lucide-react`: Modern icon library.
- `date-fns`: Date formatting and manipulation.

### Form & Validation
- `@hookform/resolvers`: Integration with validation libraries.
- `react-hook-form`: Performant form library.
- `zod`: TypeScript-first schema validation.