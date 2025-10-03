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

# Run database migrations/schema push
echo "🗄️ Setting up database schema..."
echo "📋 Creating all required tables from schema.ts..."

# Use drizzle-kit push with --force to skip interactive prompts
# This allows automatic table creation without requiring user input
npx drizzle-kit push --force

if [ $? -eq 0 ]; then
    echo "✅ Database schema created successfully!"
else
    echo "⚠️ Database schema creation encountered issues, but continuing..."
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
