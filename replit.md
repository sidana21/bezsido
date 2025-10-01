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
- Profile page displays real user posts: fetches from `/api/users/:userId/posts` and `/api/user/products`, merges both into unified grid with proper video/image rendering and empty state handling (September 30, 2025).
- Services page: Horizontal scrolling category cards with snap behavior, gradient designs, and smooth animations. Categories include: تاكسي (Taxi), توصيل (Delivery), خدمات منزلية (Home Services), تجميل (Beauty) - integrated within /stores page (September 30, 2025).
- Service categories redesigned with circular pulsing design: Perfect circles with animated outer glow, inner pulsing effects, and interactive hover animations (scale, rotate, shadow). Includes continuous color pulse animations to attract user attention (September 30, 2025).

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
- Import Completed: September 30, 2025
- GitHub Import Re-configured: September 30, 2025
- Latest GitHub Re-import Setup: September 30, 2025
- Fresh GitHub Clone Re-setup Completed: September 30, 2025
- Latest GitHub Import Setup: October 1, 2025 (Fresh GitHub Clone - All systems operational and verified)
- Fresh GitHub Clone Re-import: October 1, 2025 (Latest setup - Environment fully configured and tested)
- **Current Setup: October 1, 2025** (Fresh GitHub Clone - Verified working with all Replit configurations)

### Development Configuration
- **Port**: 5000 (frontend and backend on same port)
- **Host**: 0.0.0.0 (configured for Replit proxy)
- **Workflow**: "Start application" runs `npm run dev`
- **Output Type**: webview for frontend preview
- **Database**: PostgreSQL available via DATABASE_URL (currently using MemStorage)
- **Storage Mode**: In-memory (MemStorage) for development - data persists during session

### Deployment Configuration
- **Type**: Autoscale (stateless web app)
- **Build**: `npm run build`
- **Run**: `npm run start`
- **Production Mode**: Serves static files from dist/public
- **Configuration**: Defined in `.replit` file

### Key Files
- **Server Entry**: `server/index.ts` - Express server with Vite integration
- **Vite Config**: `vite.config.ts` - Configured with `allowedHosts: true` for Replit proxy
- **Vite Server**: `server/vite.ts` - Middleware setup with `allowedHosts: true`
- **Schema**: `shared/schema.ts` - Drizzle ORM schema definitions
- **Storage**: `server/storage.ts` - Storage interface (MemStorage/DatabaseStorage)
- **Routes**: `server/routes.ts` - API endpoint definitions

### Project Status
- ✅ All dependencies installed (Node.js 20)
- ✅ Development server running on port 5000
- ✅ Frontend loads successfully with Arabic RTL support
- ✅ Backend API responding correctly
- ✅ Vite HMR (Hot Module Replacement) working
- ✅ Admin user auto-created on startup (admin@bizchat.com)
- ✅ Default stickers, features, and missions initialized
- ✅ Deployment configuration ready for production
- ✅ Build process tested and working (npm run build)
- ✅ Production build artifacts generated in dist/ directory
- ✅ Workflow configured with webview output on port 5000
- ✅ Vite dev server configured with allowedHosts: true for Replit proxy
- ✅ All Replit environment requirements met

### Recent Bug Fixes (September 30, 2025)
- **Service Publishing Bug**: Fixed critical bug where publishing services failed due to missing `categoryId` field
  - Root cause: Frontend forms (beauty-services.tsx, home-services.tsx) weren't sending categoryId required by backend
  - Solution: Added API query to fetch service categories dynamically and include categoryId in service submission
  - Implementation: Flexible category lookup matching both Arabic (nameAr) and English (name) fields with partial matching fallback
  - Categories: "حناييات وتجميل" (Henna & Beauty) for beauty services, "اليد العاملة" (Labor Services) for home services

- **Service Images Display**: Added image rendering to service cards
  - Added comprehensive image display to both beauty-services.tsx and home-services.tsx
  - Single image displays full width at top of service card
  - Multiple images (2-3) display side by side with responsive widths
  - More than 3 images show first 3 with "+X" overflow indicator
  - Used optional chaining to prevent null/undefined errors
  - Images appear at top of service card before service information

### Known Items
- TypeScript errors exist in storage.ts (158 diagnostics) but don't prevent runtime execution
- Notification sound loading error (uses fallback ringtone) - cosmetic only
- 401 errors for unauthenticated requests are expected behavior
- App successfully loads with Arabic RTL support and login screen