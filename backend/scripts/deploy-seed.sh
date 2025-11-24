#!/bin/bash

echo "🌱 Running Production Database Seed"
echo "==================================="

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable not set"
  exit 1
fi

# Run Prisma migrations first
echo "📦 Running Prisma migrations..."
npx prisma migrate deploy

# Run the seed
echo "🌱 Running database seed..."
npx prisma db seed

echo "✅ Seed deployment complete!"
