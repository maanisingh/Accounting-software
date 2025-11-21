#!/bin/bash

# ZirakBook Backend Start Script
# This script checks for DATABASE_URL before running migrations

echo "🚀 Starting ZirakBook Backend..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set!"
  echo ""
  echo "📚 Setup Instructions:"
  echo "1. Add PostgreSQL database in Railway"
  echo "2. Add DATABASE_URL reference to this service"
  echo "3. See RAILWAY_DATABASE_SETUP.md for detailed guide"
  echo ""
  exit 1
fi

echo "✅ DATABASE_URL is set"

# Run Prisma migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy

# Check if migrations succeeded
if [ $? -ne 0 ]; then
  echo "❌ Database migrations failed!"
  echo "Check your DATABASE_URL and database connection"
  exit 1
fi

echo "✅ Database migrations completed"

# Start the server
echo "🌐 Starting Express server..."
node src/server.js
