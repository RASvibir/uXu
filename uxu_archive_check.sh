#!/usr/bin/env bash

set -e

echo "=== uXu ARCHIVE INTEGRITY CHECK ==="

echo ">> Checking archive directory"
ls -R archives || echo "No archives directory"

echo ">> Checking archive index"
ls app/api/archive/index || echo "No archive index route"

echo ">> Checking archive create route"
ls app/api/archive/create || echo "No archive create route"

echo ">> Checking archive open route"
ls app/api/archive/open || echo "No archive open route"

echo ">> Checking archive provenance"
grep -R "provenance" . || echo "No provenance markers found"

echo "=== ARCHIVE CHECK COMPLETE ==="
