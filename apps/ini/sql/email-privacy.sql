-- Account email privacy + archive contact approval (uXu)
-- Applied on production branch; Worker also ensureEmailTables() for resilience.

create table if not exists uxu_email_change_requests (
  id bigserial primary key,
  user_id uuid not null,
  current_email text not null,
  new_email text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  confirmed_at timestamptz,
  cancelled_at timestamptz
);

create index if not exists uxu_email_change_user_pending_idx
  on uxu_email_change_requests (user_id)
  where confirmed_at is null and cancelled_at is null;

create table if not exists uxu_archive_contacts (
  archive_id text primary key,
  contact_email text,
  contact_public boolean not null default false,
  holder_user_id uuid,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

create table if not exists uxu_archive_contact_requests (
  id bigserial primary key,
  archive_id text not null,
  requested_by uuid not null,
  requested_email text not null,
  make_public boolean not null default false,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid,
  note text,
  constraint uxu_archive_contact_requests_status_chk
    check (status in ('pending', 'approved', 'denied', 'cancelled'))
);

create index if not exists uxu_archive_contact_req_pending_idx
  on uxu_archive_contact_requests (status, created_at desc)
  where status = 'pending';
