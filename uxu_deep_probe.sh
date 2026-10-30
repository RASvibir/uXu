#!/usr/bin/env bash

set -e

echo "=== uXu DEEP SYSTEM PROBE ==="

echo ">> KERNEL"
uname -a

echo ">> CPU"
sysctl -n machdep.cpu.brand_string

echo ">> MEMORY"
vm_stat

echo ">> DISK"
df -h /

echo ">> NETWORK INTERFACES"
ifconfig

echo ">> ACTIVE CONNECTIONS"
netstat -an

echo ">> NODE RUNTIME"
node -v
npm -v

echo ">> NEXTJS STATUS"
ps aux | grep -E "next|node|uXu" | grep -v grep

echo ">> PORT SCAN"
lsof -i :3000 || echo "3000 free"
lsof -i :5432 || echo "5432 free"

echo ">> NEON CONNECTIVITY"
ping -c 1 ep-crimson-firefly-ad77brka-pooler.c-2.us-east-1.aws.neon.tech

echo ">> PRISMA"
npx prisma generate
npx prisma db pull

echo ">> ENV SNAPSHOT"
grep -E "DATABASE_URL|MASTER_ADMIN_EMAIL|MASTER_ADMIN_PASSWORD" .env

echo ">> ARCHIVE TREE"
ls -R archives 2>/dev/null || echo "no archives"

echo ">> API CHECK"
curl -s http://localhost:3000/api/auth/me || echo "auth/me offline"
curl -s http://localhost:3000/api/archive/index || echo "archive/index offline"

echo "=== DEEP SYSTEM PROBE COMPLETE ==="
