#!/bin/bash
set -e

echo "🚀 Starting ZirakBook Backend..."

# Run database migrations
echo "📦 Running Prisma migrations..."
npx prisma db push --accept-data-loss

# Try to seed database (don't fail if it errors - user might already exist)
echo "🌱 Seeding database..."
node prisma/seed.js || echo "⚠️  Seeding skipped (users may already exist)"

# Start the server
echo "✅ Starting server..."
node src/server.js
