#!/usr/bin/env bash

set -e

echo "=== uXu FULL SYSTEM REPAIR ==="

echo ">> Reinstall node modules"
rm -rf node_modules
npm install

echo ">> Rebuild Prisma client"
npx prisma generate

echo ">> Resync DB schema"
npx prisma db pull

echo ">> Verify .env"
grep -E "DATABASE_URL|DATABASE_URL_UNPOOLED|MASTER_ADMIN_EMAIL|MASTER_ADMIN_PASSWORD" .env

echo ">> Clear Next.js cache"
rm -rf .next

echo ">> Restart dev server"
npm run dev &

echo ">> Check API health"
sleep 3
curl -s http://localhost:3000/api/auth/me || echo "auth/me offline"
curl -s http://localhost:3000/api/archive/index || echo "archive/index offline"

echo "=== FULL SYSTEM REPAIR COMPLETE ==="
