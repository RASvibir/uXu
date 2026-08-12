# ini runtime (operators)

Runtime app for the root archive interface inside the uXu repository.
This directory is the app/runtime root for Neon, environment files,
and Cloudflare Worker deployment. Archive content remains in `/archives`.

**License:** MIT (same as the uXu repository root `LICENSE`).

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

After claim succeeds, run `SETUP MASTER` on 0?0, add a recovery email, optionally attest 2FA, then rotate or clear the bootstrap secret if you no longer need empty-throne break-glass.

See `archives/RTFM/MASTER-ADMIN-GUIDE.md`.

### Worker auth routes

- `GET /api/auth/config`
- `GET /api/auth/me` (session bearer token)
- `GET /api/auth/setup-status`
- `GET /api/auth/recovery` (ADMIN + SUDO)
- `GET /api/auth/accounts` (ADMIN + SUDO) — login emails, private
- `GET /api/auth/change-email/status`
- `GET /api/auth/archive-contact/pending` (ADMIN + SUDO)
- `POST /api/archives/create` — signed-in create (requires `confirm: true`)
- `GET /api/archives/:id/app` — live HTML for 0?0-created archives
- `GET /api/archives/:id/access` — steward check for private archives (session bearer)
- `GET /api/archives/:id/contact` — public email only if opted-in + approved
- `POST /api/auth/audit` — signup/signin audit from console
- `POST /api/auth/change-email/request` — password + OTP to current inbox
- `POST /api/auth/change-email/confirm`
- `POST /api/auth/archive-contact/request`
- `POST /api/auth/archive-contact/approve|deny` (ADMIN + SUDO)
- `POST /api/auth/claim-master` (sealed if admin exists)
- `POST /api/auth/sudo`
- `POST /api/auth/unsudo`
- `POST /api/auth/sign-out`
- `POST /api/auth/recovery/add|remove|attest-2fa` (ADMIN + SUDO)
- `POST /api/auth/assume-master` (recovery account)
- `GET /api/auth/events` (requires ADMIN + SUDO)

Session token comes from Neon Auth `sign-up` / `sign-in` JSON `token` and is sent as `Authorization: Bearer …`.

Login emails are never public. Archive contact emails are private by default; making them public (or changing a public holder email) requires admin approval.
