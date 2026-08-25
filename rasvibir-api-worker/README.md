# rasvibir-api

Cloudflare Worker API backend with CORS handling and Neon PostgreSQL authentication.

## Features

- ✅ CORS preflight (`OPTIONS`) handling — returns `204 No Content` with proper headers
- ✅ CORS headers appended to all outgoing responses
- ✅ `POST /api/auth/login` — parses JSON body, queries Neon DB, verifies credentials, returns session token
- ✅ Hyperdrive integration for connection pooling (recommended) or `DATABASE_URL` secret fallback
- ✅ `GET /api/health` — health check endpoint

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Hyperdrive (recommended)

```bash
npx wrangler hyperdrive create neon-db \
  --connection-string="postgres://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
```

Copy the returned ID into `wrangler.toml`:

```toml
[[hyperdrive]]
binding = "HYPERDRIVE"
id = "<YOUR_HYPERDRIVE_ID>"
```

### 3. Set secrets (if not using Hyperdrive, or for JWT signing)

```bash
npx wrangler secret put DATABASE_URL
npx wrangler secret put JWT_SECRET
```

### 4. Local development

```bash
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your local database connection string
npm run dev
```

### 5. Deploy

```bash
npm run deploy
```

## API Endpoints

### `POST /api/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secret"
}
```

**Success (200):**
```json
{
  "token": "a1b2c3d4...",
  "email": "user@example.com",
  "role": "ADMIN"
}
```

**Failure (401):**
```json
{
  "error": "invalid credentials"
}
```

### `GET /api/health`

Returns database connection status.

## Database Schema

The login route expects a `neon_auth.users` table with columns:

| Column | Type | Description |
|---|---|---|
| `id` | uuid/serial | Primary key |
| `email` | text | User email (unique) |
| `password_hash` | text | Stored password (hash in production) |
| `role` | text | User role (e.g. `ADMIN`) |

## Security Notes

- **Password hashing:** This example uses a constant-time comparison against the stored `password_hash` column. In production, use bcrypt or argon2 to hash passwords. Workers don't have native bcrypt support — consider hashing on your origin or using a dedicated auth service.
- **Session tokens:** The generated token is a 256-bit random hex string. For JWT-based sessions, sign tokens with `JWT_SECRET` using a library like `jose`.
- **CORS:** `Access-Control-Allow-Origin` is set to `*` for simplicity. For production, consider restricting to your specific domain (`https://rasvibir.github.io`).

## Frontend Integration (GitHub Pages)

```javascript
const response = await fetch("https://rasvibir-api.<your-subdomain>.workers.dev/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
const data = await response.json();
```
