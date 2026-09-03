# Master Admin Guide

Tags: master-admin, recovery, claim-master, setup, 2fa, operators
Source: uXu operator lore · interactive twin: SETUP MASTER on 0?0

## What This Is

Step-by-step guide to claim the master admin crown, seal the public rite,
and appoint a **second email** as recovery — with an optional **2FA** checkoff.

On the live console, run:

```text
SETUP MASTER
```

That command refreshes a live checklist. This page is the same path in prose.

## Before You Start

- You can sign up on 0?0.
- Wrangler secret `ADMIN_BOOTSTRAP_SECRET` is set (for empty-throne claim only).
- Optional but wise: `MASTER_ADMIN_EMAIL` locked to your primary email.
- A **second email** ready for recovery (different inbox).

## Step 1 — Sign in

```text
SIGNUP you@primary.com yourpassword YourName
```

or SIGNIN if you already exist.

## Step 2 — Claim (only if throne is empty)

```text
CLAIM MASTER <bootstrap-secret>
```

- Works **only** when there are zero admins (catastrophe / first boot).
- Once any admin exists, CLAIM MASTER becomes a **sealed lore rite**
  (funny public failures; no crowning).

Then:

```text
SUDO
```

## Step 3 — Lock succession with a recovery email (minimum)

1. In another browser/profile (or after sign-out), create the backup account:

```text
SIGNUP backup@email.com otherpassword Backup Name
```

2. Sign back in as master, `SUDO`, then:

```text
RECOVERY ADD backup@email.com
RECOVERY LIST
```

Recovery must be a **different email** than master.

## Step 4 — Optional: connect 2FA

uXu records an **attestation** that you enabled 2FA (checklist). Real TOTP lives on your Neon account today:

1. Open [Neon Console](https://console.neon.tech) → **Account settings** → **Set up two-factor authentication**  
   Docs: https://neon.com/docs/manage/accounts#two-factor-authentication
2. Protect the Neon org/project that holds uXu (this is the real backend lock).
3. Use a strong unique password on the recovery uXu login.
4. Attest in the console:

```text
RECOVERY 2FA backup@email.com
SETUP MASTER
```

You should see step 5 checked.

## Step 5 — Confirm the seal

```text
CLAIM MASTER
```

(no secret needed to hear the lore)

Expected: **RITE SEALED** — crown already spoken for.

## Emergency — assume from recovery

If the master account is lost:

1. SIGNIN as `backup@email.com`
2. `ASSUME MASTER`
3. `SUDO`
4. `RECOVERY LIST` — add a new backup; rotate Wrangler secrets if needed

## Commands Cheatsheet

| Command | Who |
|---------|-----|
| `SETUP MASTER` | Anyone (checklist flags only; recovery addresses need ADMIN + SUDO) |
| `CLAIM MASTER [secret]` | Signed-in; real claim only if no admins |
| `SUDO` / `UNSUDO` | Admin |
| `RECOVERY ADD\|LIST\|REMOVE\|2FA` | Admin + SUDO |
| `ASSUME MASTER` | Active recovery account |
| `ACCOUNTS` | Admin + SUDO — private login email list |
| `MONITOR` / `ALERTS` | Admin — intake (creates, contacts); `MONITOR ACK <id>` |
| `FLAG` / `LOCK` / `REMOVE` / `RESTORE` `<id>` | Admin + SUDO — at-will registry marker (not auto; not editing other people’s files) |
| `ARCHIVE CONTACT PENDING` / `APPROVE` / `DENY` | Admin + SUDO |

## Monitor vs enforcement

iNi and MAP do **not** police archives. **MONITOR** only alerts you (new rooms,
contact / Message 0?0, optional malice-hint words). You act **at your will**:
`SUDO`, then `FLAG` / `LOCK` / `REMOVE` / `RESTORE` on a selected id. Root
`0?0.uXu.0000` cannot be marked. Registry reads no longer force known rooms
back to LIVE, so a marker you set sticks. Other people’s archive folders are
not rewritten as curation.

Redeploy the API worker after pulling so `/api/admin/monitor` and
`/api/admin/marker` exist.

## Accounts & email privacy

Login emails are **never public**. `ACCOUNTS` lists who signed up. Sign-up / sign-in are audited.

Users change login email with OTP to the **current** inbox (`CHANGE EMAIL`).  
Publishing or changing a **public** archive holder contact needs your approval via `ARCHIVE CONTACT PENDING`.

## Legacy

CLAIM MASTER remains visible on purpose — a founding myth.
Authority lives in Neon Auth roles + recovery keys, not in the public chant.
