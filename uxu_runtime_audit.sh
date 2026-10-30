#!/usr/bin/env bash

set -e

echo "=== uXu RUNTIME AUDIT ==="

echo ">> Node version"
node -v

echo ">> NPM version"
npm -v

echo ">> Checking running processes"
ps aux | grep -E "node|next|uXu" | grep -v grep

echo ">> Checking port usage"
lsof -i :3000 || echo "Port 3000 not in use"

echo ">> Checking Neon connectivity"
ping -c 1 ep-crimson-firefly-ad77brka-pooler.c-2.us-east-1.aws.neon.tech

echo ">> Checking Prisma connectivity"
npx prisma db pull

echo ">> Checking archive directory"
ls -R archives 2>/dev/null || echo "No archives directory"

echo ">> Checking API health"
curl -s http://localhost:3000/api/auth/me || echo "API not responding"

echo "=== RUNTIME AUDIT COMPLETE ==="
