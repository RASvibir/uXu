# ini runtime (operators)

Runtime app for the root archive interface inside the uXu repository.
This directory is the app/runtime root for Neon, environment files,
and Cloudflare Worker deployment. Archive content remains in `/archives`.

**Public visitors** should use the site / User Guide — not this file.
This README is for operators deploying the Worker.

## Auth (Neon Auth + Worker)

Neon Auth base URL is configured as a non-secret Worker var (`NEON_AUTH_BASE_URL`).

Roles in `0?0`:

| Role | Meaning |
| --- | --- |
| `GUEST` | Not signed in |
| `USER` | Signed-in Neon Auth account |
| `ADMIN` | Master operator (`neon_auth.user.role = admin`) |
| `SUDO` | Temporary elevation flag for an ADMIN session |

### Create an account (console)

```text
SIGNUP you@email.com yourpassword YourName
```

Or use the ACCOUNT GATE form on 0?0.

### Claim master administrator (one-time / private)

Only needed for first bootstrap. Prefer setting admin in the Neon Auth console
when possible. Keep the bootstrap secret in Wrangler secrets — never commit it.

```bash
cd apps/ini
npx wrangler secret put ADMIN_BOOTSTRAP_SECRET --env production
# optional lock to one email:
npx wrangler secret put MASTER_ADMIN_EMAIL --env production
```

Then, privately (not in public docs you hand strangers):

```text
SIGNIN …
CLAIM MASTER <bootstrap-secret>
SUDO
```

After claim succeeds, rotate or clear the bootstrap secret if you no longer need it.

### Worker auth routes

- `GET /api/auth/config`
- `GET /api/auth/me` (session bearer token)
- `POST /api/auth/claim-master`
- `POST /api/auth/sudo`
- `POST /api/auth/unsudo`
- `POST /api/auth/sign-out`
- `GET /api/auth/events` (requires ADMIN + SUDO)

Session token comes from Neon Auth `sign-up` / `sign-in` JSON `token` and is sent as `Authorization: Bearer …`.
