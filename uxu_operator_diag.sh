#!/usr/bin/env bash

set -e

echo "=== uXu OPERATOR DIAGNOSTIC ==="

echo ">> SYSTEM STATUS"
uname -a
uptime

echo ">> NODE SERVICES"
ps aux | grep -E "node|next|uXu" | grep -v grep

echo ">> PORTS"
lsof -i :3000 || echo "port 3000 free"
lsof -i :5432 || echo "port 5432 free"

echo ">> NEON STATUS"
ping -c 1 ep-crimson-firefly-ad77brka-pooler.c-2.us-east-1.aws.neon.tech

echo ">> PRISMA"
npx prisma generate
npx prisma db pull

echo ">> ARCHIVE INDEX"
ls -R archives 2>/dev/null || echo "no archives"

echo ">> API HEALTH"
curl -s http://localhost:3000/api/auth/me || echo "auth/me offline"
curl -s http://localhost:3000/api/archive/index || echo "archive/index offline"

echo ">> ENV SNAPSHOT"
grep -E "DATABASE_URL|MASTER_ADMIN_EMAIL" .env

echo "=== OPERATOR DIAGNOSTIC COMPLETE ==="
