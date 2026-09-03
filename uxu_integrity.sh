#!/usr/bin/env bash

set -e

echo "=== uXu BACKEND INTEGRITY CHECK ==="

echo ">> Checking .env"
grep DATABASE_URL .env
grep DATABASE_URL_UNPOOLED .env
grep MASTER_ADMIN_EMAIL .env
grep MASTER_ADMIN_PASSWORD .env

echo ">> Checking Prisma schema"
grep -R "model Master" prisma/schema.prisma

echo ">> Checking API routes"
ls app/api/auth/login
ls app/api/auth/signup
ls app/api/auth/me

echo ">> Checking Prisma client"
npx prisma generate

echo "=== INTEGRITY CHECK COMPLETE ==="
