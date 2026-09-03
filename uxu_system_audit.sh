#!/usr/bin/env bash

set -e

echo "=== uXu SYSTEM AUDIT ==="

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

echo ">> Checking archive routes"
ls app/api/archive/index 2>/dev/null || echo "archive index missing"
ls app/api/archive/create 2>/dev/null || echo "archive create missing"
ls app/api/archive/open 2>/dev/null || echo "archive open missing"

echo ">> Checking provenance files"
ls uXu.PROVENANCE.md 2>/dev/null || echo "provenance file missing"
ls .env.example 2>/dev/null || echo "env example missing"

echo ">> Checking Prisma client"
npx prisma generate

echo "=== SYSTEM AUDIT COMPLETE ==="
