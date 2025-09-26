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