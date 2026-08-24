#!/usr/bin/env bash

set -e

echo "=== uXu FULLSTACK DIAGNOSTIC ==="

echo ">> ENV VARS"
grep DATABASE_URL .env
grep DATABASE_URL_UNPOOLED .env
grep MASTER_ADMIN_EMAIL .env
grep MASTER_ADMIN_PASSWORD .env

echo ">> PRISMA SCHEMA"
grep -R "model Master" prisma/schema.prisma

echo ">> PRISMA CLIENT"
npx prisma generate

echo ">> DB SYNC"
npx prisma db pull

echo ">> API ROUTES"
ls app/api/auth/login 2>/dev/null || echo "login route missing"
ls app/api/auth/signup 2>/dev/null || echo "signup route missing"
ls app/api/auth/me 2>/dev/null || echo "me route missing"

ls app/api/archive/index 2>/dev/null || echo "archive index missing"
ls app/api/archive/create 2>/dev/null || echo "archive create missing"
ls app/api/archive/open 2>/dev/null || echo "archive open missing"

echo ">> RUNTIME"
node -v
npm -v

echo ">> PROCESS CHECK"
ps aux | grep -E "node|next|uXu" | grep -v grep

echo ">> PORT CHECK"
lsof -i :3000 || echo "port 3000 free"

echo ">> NEON CONNECTIVITY"
ping -c 1 ep-crimson-firefly-ad77brka-pooler.c-2.us-east-1.aws.neon.tech

echo ">> API HEALTH"
curl -s http://localhost:3000/api/auth/me || echo "API not responding"

echo "=== FULLSTACK DIAGNOSTIC COMPLETE ==="
