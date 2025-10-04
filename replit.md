# Bivochat

## Overview

Bivochat is a full-stack business messaging application built with React, TypeScript, and Express. It integrates messaging with commerce features, offering a responsive UI for business communication and trade. Key capabilities include individual and group chats, product promotion via stories/status updates, message status tracking, and robust Arabic language support. The project aims to provide a social media experience similar to TikTok, integrated with business functionalities.

## User Preferences

Preferred communication style: Simple, everyday language.

## Privacy Policy & Google Play Store Compliance

### Privacy Policy Page
- **Location**: `/privacy-policy` - Accessible without authentication
- **File**: `client/src/pages/privacy-policy.tsx`
- **Links**: Available in login page footer and profile settings

### Key Privacy Commitments
1. **No Data Selling**: User data is never sold to third parties
2. **User Control**: Users can delete their accounts and all data anytime
3. **Transparency**: Clear explanations for all permissions and data usage
4. **Cash-Only Payments**: No financial data collected (cash-on-delivery only)
5. **Continuous Development**: Commitment to ongoing app improvements

### Permissions Explained
- **Notifications**: For new messages, comments, and product updates
- **Photos/Media**: Only for uploading product images and profile pictures

### Google Play Store Requirements Met
- ✅ Comprehensive privacy policy with Arabic language support
- ✅ Clear data collection and usage disclosure
- ✅ User rights (deletion, modification, export)
- ✅ Permissions justification
- ✅ No collection of financial information
- ✅ Children's privacy protection (13+ age requirement)
- ✅ Contact information provided

## Replit Environment Setup

### Development Configuration
- **Workflow**: ✅ Configured and running `npm run dev` on port 5000 with webview output
- **Host Configuration**: ✅ Frontend server runs on `0.0.0.0:5000` with `allowedHosts: true` for Replit proxy compatibility
- **Database**: ✅ PostgreSQL database connected successfully (using local helium database)
- **Auto-initialization**: Database tables auto-verified on startup (136 tables exist)

### Deployment Configuration
- **Target**: ✅ Autoscale (stateless web application)
- **Build**: ✅ `npm run build` (builds Vite frontend and bundles Express backend)
- **Run**: ✅ `npm run start` (runs production server from `dist/index.js`)
- **Port Configuration**: ✅ Port 5000 mapped to external port 80

### GitHub Import Setup Status (October 4, 2025)
- ✅ Project successfully imported from GitHub
- ✅ Node.js 20 module installed and configured
- ✅ All npm dependencies installed successfully
- ✅ PostgreSQL database connected (136 tables verified)
- ✅ Frontend accessible and rendering correctly on port 5000
- ✅ Backend Express server running with Vite middleware
- ✅ Workflow configured with webview output for frontend preview
- ✅ Deployment configuration set to autoscale
- ✅ Ready for development and deployment

### Important Notes
- ✅ **Vite Configuration**: Already optimized for Replit environment with correct host (`0.0.0.0:5000`) and `allowedHosts: true` for proxy compatibility
- ✅ **SSL Configuration**: Development mode automatically disables SSL verification
- ✅ **Authentication**: Working correctly (401 errors expected before login)
- ⚠️ **Cloudinary**: File upload credentials not configured (optional for local development, required for production)
- ℹ️ **Database**: Using local PostgreSQL connection, all tables verified and working

## Render Deployment

### Files Created for Render Deployment
- ✅ `scripts/deploy-render.sh`: Automated deployment script for Render
- ✅ `scripts/verify-tables.sql`: SQL script to verify all tables exist in production database
- ✅ `RENDER_DEPLOYMENT_COMPLETE_GUIDE.md`: Complete step-by-step deployment guide in Arabic

### Deployment Process
1. **Database Setup**: Create Neon PostgreSQL database
2. **Environment Variables**: Set DATABASE_URL and other required vars in Render
3. **Build Command**: `chmod +x scripts/deploy-render.sh && ./scripts/deploy-render.sh`
4. **Start Command**: `npm run start`
5. **Schema Push**: Run `npm run db:push` in Render Shell to create all tables
6. **Verify**: Use `scripts/verify-tables.sql` in Neon Console to verify all tables exist

### Required Tables for Social Features
- `story_likes`: For story reactions/likes
- `story_comments`: For commenting on stories
- `follows`: For user following system
- All other tables defined in `shared/schema.ts`

See `RENDER_DEPLOYMENT_COMPLETE_GUIDE.md` for complete deployment instructions.

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
- Product and service delete functionality with owner-only access control and confirmation dialogs in both store products and beauty services pages.
- **Mobile product upload**: Native HTML select elements provide reliable mobile compatibility for category selection (replacing Radix UI Select).
- **Video views tracking**: Automatic view tracking via Intersection Observer (70% visibility for 1 second), views badge always displays including "0 مشاهدة" for new posts.
- **Verification requests**: Enhanced error handling with Arabic error messages and requestType field validation.

### Admin Panel Features
- **Comprehensive Dashboard Statistics**: Real-time monitoring of users, stores, orders, revenue, and verification requests.
- **User Management System**: Block/unblock functionality, post count tracking, detailed user information.
- **Real-time Notification System**: Visual indicators, pulsing badges for pending verification requests, recent activities feed.
- **Sound Alert System**: Automatic audio notifications for new verification requests with debouncing.
- **Admin Announcements System**: Dedicated page for sending announcements to all users, displayed with distinctive styling in user notifications.
- **API Endpoints**: Dedicated endpoints for dashboard stats, activities, user management, and announcements.

## File Upload System (Cloudinary Integration)

### Overview
The application uses Cloudinary for reliable cloud storage of images and videos. Files are uploaded to Cloudinary and only URLs are stored in NeonDB, preventing data loss on platforms like Render that use ephemeral storage.

### Setup on Render
Add these environment variables in Render dashboard:
- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Your API key
- `CLOUDINARY_API_SECRET`: Your API secret

Get these values from [Cloudinary Dashboard](https://cloudinary.com/console) → Account Details

### How It Works
1. Files are uploaded to `/api/upload/media` endpoint
2. Multer stores files in memory (memoryStorage)
3. Files are uploaded to Cloudinary using the Node.js SDK
4. Cloudinary URLs are returned and saved in database
5. If Cloudinary is unavailable, fallback to local storage (temporary)

### Implementation Details
- **Location**: `server/cloudinary.ts` - Cloudinary configuration and upload functions
- **Modified Files**: 
  - `server/routes.ts` - Upload endpoint updated to use Cloudinary
  - `server/index.ts` - Cloudinary initialization on startup
- **Package**: `cloudinary` npm package installed
- **Storage**: Uses memoryStorage for temporary file handling before cloud upload

## External Dependencies

### Core Framework & Database
- `@neondatabase/serverless`: PostgreSQL serverless driver.
- `drizzle-orm`: Type-safe ORM.
- `drizzle-kit`: Database migration and schema management.
- `connect-pg-simple`: PostgreSQL session store.
- `express-session`: Server-side session management.

### File Upload & Storage
- `cloudinary`: Cloud-based image and video storage service.
- `multer`: Multipart form data handling for file uploads.

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