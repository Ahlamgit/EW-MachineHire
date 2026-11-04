-- DEMO / capacity-measurement schema ONLY.
-- Label: DEMO_CAPACITY — never treat as production customer data.
-- Not a Phase migration. Applied by scripts/seed-capacity-demo.mjs against local Postgres
-- (or manually against a linked staging Supabase for measurement).
-- No file blobs; attachment columns are metadata paths only (null in seed).

create extension if not exists "pgcrypto";

create schema if not exists demo_capacity;
comment on schema demo_capacity is 'DEMO capacity harness — disposable measurement data';

-- ---------------------------------------------------------------------------
-- Identity (no auth.users FK — local harness uses synthetic UUIDs)
-- ---------------------------------------------------------------------------

create table if not exists demo_capacity.profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text not null,
  is_active boolean not null default true,
  is_demo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists demo_capacity.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null
);

create table if not exists demo_capacity.user_roles (
  user_id uuid not null references demo_capacity.profiles (id) on delete cascade,
  role_id uuid not null references demo_capacity.roles (id) on delete cascade,
  primary key (user_id, role_id)
);

-- ---------------------------------------------------------------------------
-- Organisation / fleet
-- ---------------------------------------------------------------------------

create table if not exists demo_capacity.branches (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  is_demo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists demo_capacity.machine_types (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null
);

create table if not exists demo_capacity.machines (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  type_id uuid references demo_capacity.machine_types (id),
  branch_id uuid references demo_capacity.branches (id),
  status text not null default 'available',
  serial_number text,
  notes text,
  is_demo boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists machines_status_idx on demo_capacity.machines (status) where deleted_at is null;
create index if not exists machines_branch_idx on demo_capacity.machines (branch_id);

-- ---------------------------------------------------------------------------
-- Customers / hiring
-- ---------------------------------------------------------------------------

create table if not exists demo_capacity.customers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  contact_email text,
  is_demo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists demo_capacity.hire_agreements (
  id uuid primary key default gen_random_uuid(),
  agreement_number text not null unique,
  customer_id uuid not null references demo_capacity.customers (id),
  status text not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  notes text,
  is_demo boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists hire_agreements_customer_idx on demo_capacity.hire_agreements (customer_id);
create index if not exists hire_agreements_status_idx on demo_capacity.hire_agreements (status);

create table if not exists demo_capacity.hire_items (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null references demo_capacity.hire_agreements (id) on delete cascade,
  machine_id uuid not null references demo_capacity.machines (id),
  status text not null,
  assigned_at timestamptz not null,
  returned_at timestamptz,
  is_demo boolean not null default true
);

create index if not exists hire_items_machine_idx on demo_capacity.hire_items (machine_id);
create index if not exists hire_items_agreement_idx on demo_capacity.hire_items (agreement_id);

create table if not exists demo_capacity.hire_events (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null references demo_capacity.hire_agreements (id) on delete cascade,
  machine_id uuid references demo_capacity.machines (id),
  event_type text not null,
  occurred_at timestamptz not null,
  payload jsonb not null default '{}'::jsonb,
  is_demo boolean not null default true
);

create index if not exists hire_events_agreement_idx on demo_capacity.hire_events (agreement_id, occurred_at desc);

-- ---------------------------------------------------------------------------
-- Operational logs (append-only metadata — no blobs)
-- ---------------------------------------------------------------------------

create table if not exists demo_capacity.machine_readings (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references demo_capacity.machines (id),
  reading_hours numeric(12, 2) not null,
  occurred_at timestamptz not null,
  notes text,
  is_demo boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists machine_readings_machine_time_idx
  on demo_capacity.machine_readings (machine_id, occurred_at desc);

create table if not exists demo_capacity.fuel_events (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references demo_capacity.machines (id),
  litres numeric(12, 2) not null,
  occurred_at timestamptz not null,
  odometer_hours numeric(12, 2),
  notes text,
  is_demo boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists fuel_events_machine_time_idx
  on demo_capacity.fuel_events (machine_id, occurred_at desc);

create table if not exists demo_capacity.tyre_events (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references demo_capacity.machines (id),
  event_type text not null,
  occurred_at timestamptz not null,
  notes text,
  is_demo boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists tyre_events_machine_time_idx
  on demo_capacity.tyre_events (machine_id, occurred_at desc);

create table if not exists demo_capacity.maintenance_records (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references demo_capacity.machines (id),
  kind text not null,
  status text not null,
  scheduled_at timestamptz,
  completed_at timestamptz,
  summary text,
  is_demo boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists maintenance_machine_idx
  on demo_capacity.maintenance_records (machine_id, created_at desc);

-- Compliance metadata only — storage_path intentionally null (no attachments)
create table if not exists demo_capacity.compliance_records (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references demo_capacity.machines (id),
  document_type text not null,
  status text not null,
  issued_at date,
  expires_at date,
  storage_path text,
  notes text,
  is_demo boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists compliance_machine_expiry_idx
  on demo_capacity.compliance_records (machine_id, document_type, expires_at);

create table if not exists demo_capacity.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references demo_capacity.profiles (id),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  is_demo boolean not null default true
);

create index if not exists audit_logs_time_idx on demo_capacity.audit_logs (occurred_at desc);
create index if not exists audit_logs_entity_idx on demo_capacity.audit_logs (entity_type, entity_id);
