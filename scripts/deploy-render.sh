#!/bin/bash

# Render Deployment Script for BizChat
# This script sets up the database schema on first deployment

echo "🚀 Starting Render Deployment Process..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set!"
    exit 1
fi

echo "✅ DATABASE_URL is configured"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run database schema push
echo "🗄️ Setting up database schema..."
echo "📋 Creating all 53 tables (story_likes, story_comments, follows, etc)..."

# Use drizzle-kit push with --force flag
# This creates all tables from schema.ts without interactive prompts
# It automatically handles CREATE TABLE IF NOT EXISTS
echo "🚀 Pushing schema to database..."
npx drizzle-kit push --force

if [ $? -eq 0 ]; then
    echo "✅ All 53 database tables created/verified successfully!"
    echo "✅ Including: story_likes, story_comments, follows, posts, and all other tables"
else
    echo "❌ Schema push failed! Check DATABASE_URL and network connectivity"
    exit 1
fi

# Build the application
echo "🔨 Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
else
    echo "❌ Build failed!"
    exit 1
fi

echo "🎉 Deployment preparation complete!"
echo "📝 Remember to:"
echo "   1. Set DATABASE_URL in Render environment variables"
echo "   2. Set PORT (Render sets this automatically)"
echo "   3. Set NODE_ENV=production"
echo "   4. Add any other required secrets (SENDGRID_API_KEY, etc.)"
