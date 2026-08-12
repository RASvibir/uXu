# ini runtime

Runtime app for the root archive interface inside the uXu repository.
This directory is the app/runtime root for Neon, environment files,
and Cloudflare Worker deployment. Archive content remains in `/archives`.

## Auth (Neon Auth + Worker)

Neon Auth base URL (public):

```text
https://ep-crimson-firefly-ad77brka.neonauth.c-2.us-east-1.aws.neon.tech/uXu/auth
```

Roles in `0?0`:

| Role | Meaning |
| --- | --- |
| `GUEST` | Not signed in |
| `USER` | Signed-in Neon Auth account |
| `ADMIN` | Master operator (`neon_auth.user.role = admin`) |
| `SUDO` | Temporary elevation flag for an ADMIN session |

### Create an account

In `0?0`:

```text
SIGNUP you@email.com yourpassword YourName
```

Or use the **ACCOUNT GATE** form.

### Claim master administrator

1. Deploy Worker secrets (once):

```bash
cd apps/ini
npx wrangler secret put ADMIN_BOOTSTRAP_SECRET --env production
# optional lock to one email:
npx wrangler secret put MASTER_ADMIN_EMAIL --env production
```

2. Sign in on `0?0`, then:

```text
CLAIM MASTER <bootstrap-secret>
SUDO
```

You can also mark a user admin in Neon Console → Auth → Users → Make admin, then `SUDO`.

### Worker auth routes

- `GET /api/auth/config`
- `GET /api/auth/me` (session bearer token)
- `POST /api/auth/claim-master`
- `POST /api/auth/sudo`
- `POST /api/auth/unsudo`
- `POST /api/auth/sign-out`
- `GET /api/auth/events` (requires ADMIN + SUDO)

Session token comes from Neon Auth `sign-up` / `sign-in` JSON `token` and is sent as `Authorization: Bearer …`.
