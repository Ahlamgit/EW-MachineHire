-- Phase 2: profiles, RBAC tables, helpers, RLS baseline, Proposed seed data.
-- Apply to a non-production Supabase project first.
-- See docs/PERMISSIONS.md and docs/AUTH_SETUP.md.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles (id) on delete cascade,
  permission_id uuid not null references public.permissions (id) on delete cascade,
  primary key (role_id, permission_id)
);

create table if not exists public.user_roles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

create index if not exists user_roles_role_id_idx on public.user_roles (role_id);
create index if not exists role_permissions_permission_id_idx on public.role_permissions (permission_id);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- New auth user → profile
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Permission helpers (SECURITY DEFINER; used by RLS)
-- ---------------------------------------------------------------------------

create or replace function public.current_user_has_permission(permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.role_permissions rp on rp.role_id = ur.role_id
    join public.permissions p on p.id = rp.permission_id
    join public.profiles pr on pr.id = ur.user_id
    where ur.user_id = auth.uid()
      and pr.is_active = true
      and p.key = permission_key
  );
$$;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    join public.profiles pr on pr.id = ur.user_id
    where ur.user_id = auth.uid()
      and pr.is_active = true
      and r.key = 'admin'
  );
$$;

create or replace function public.current_user_permission_keys()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(distinct p.key), '{}'::text[])
  from public.user_roles ur
  join public.role_permissions rp on rp.role_id = ur.role_id
  join public.permissions p on p.id = rp.permission_id
  join public.profiles pr on pr.id = ur.user_id
  where ur.user_id = auth.uid()
    and pr.is_active = true;
$$;

revoke all on function public.current_user_has_permission(text) from public;
revoke all on function public.current_user_is_admin() from public;
revoke all on function public.current_user_permission_keys() from public;
grant execute on function public.current_user_has_permission(text) to authenticated;
grant execute on function public.current_user_is_admin() to authenticated;
grant execute on function public.current_user_permission_keys() to authenticated;

-- ---------------------------------------------------------------------------
-- Seed Proposed roles & permissions (idempotent)
-- ---------------------------------------------------------------------------

insert into public.roles (key, label, description) values
  ('admin', 'Administrator', 'Proposed: full system administration'),
  ('operations', 'Operations / Hire desk', 'Proposed: customers and hiring'),
  ('workshop', 'Workshop / Maintenance', 'Proposed: maintenance and repairs'),
  ('compliance', 'Compliance officer', 'Proposed: compliance documents'),
  ('viewer', 'Viewer / Auditor', 'Proposed: read-only + audit')
on conflict (key) do nothing;

insert into public.permissions (key, description) values
  ('dashboard:read', 'View dashboard'),
  ('machines:read', 'View machines'),
  ('machines:write', 'Mutate machines'),
  ('customers:read', 'View customers'),
  ('customers:write', 'Mutate customers'),
  ('hires:read', 'View hires'),
  ('hires:write', 'Mutate hires'),
  ('hires:close', 'Close hires'),
  ('compliance:read', 'View compliance'),
  ('compliance:write', 'Mutate compliance'),
  ('maintenance:read', 'View maintenance'),
  ('maintenance:write', 'Mutate maintenance'),
  ('ops_logs:read', 'View operational logs'),
  ('ops_logs:write', 'Write operational logs'),
  ('reports:read', 'View non-financial reports'),
  ('notifications:read', 'View notifications'),
  ('audit:read', 'View audit history'),
  ('users:manage', 'Manage users and roles'),
  ('settings:manage', 'Manage system settings'),
  ('finance:read', 'Reserved: financial read — unassigned until invoicing Confirmed'),
  ('finance:write', 'Reserved: financial write — unassigned until invoicing Confirmed')
on conflict (key) do nothing;

-- Clear and re-apply Proposed matrix for seed roles (safe for early Phase 2)
delete from public.role_permissions rp
using public.roles r
where rp.role_id = r.id
  and r.key in ('admin', 'operations', 'workshop', 'compliance', 'viewer');

-- admin: all except finance:* (reserved / unassigned)
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'admin'
  and p.key not in ('finance:read', 'finance:write');

-- operations
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'operations'
  and p.key in (
    'dashboard:read', 'machines:read', 'machines:write',
    'customers:read', 'customers:write',
    'hires:read', 'hires:write', 'hires:close',
    'compliance:read',
    'maintenance:read',
    'ops_logs:read', 'ops_logs:write',
    'reports:read', 'notifications:read'
  );

-- workshop
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'workshop'
  and p.key in (
    'dashboard:read', 'machines:read', 'hires:read',
    'compliance:read',
    'maintenance:read', 'maintenance:write',
    'ops_logs:read', 'ops_logs:write',
    'reports:read', 'notifications:read'
  );

-- compliance
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'compliance'
  and p.key in (
    'dashboard:read', 'machines:read', 'hires:read',
    'compliance:read', 'compliance:write',
    'reports:read', 'notifications:read'
  );

-- viewer
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'viewer'
  and p.key in (
    'dashboard:read', 'machines:read', 'customers:read', 'hires:read',
    'compliance:read', 'maintenance:read', 'ops_logs:read',
    'reports:read', 'notifications:read', 'audit:read'
  );

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;

-- profiles
drop policy if exists profiles_select_self_or_admin on public.profiles;
create policy profiles_select_self_or_admin
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.current_user_is_admin());

drop policy if exists profiles_update_self_or_admin on public.profiles;
create policy profiles_update_self_or_admin
  on public.profiles for update to authenticated
  using (id = auth.uid() or public.current_user_is_admin())
  with check (id = auth.uid() or public.current_user_is_admin());

-- roles / permissions catalogue: readable to authenticated; writable by admin
drop policy if exists roles_select_authenticated on public.roles;
create policy roles_select_authenticated
  on public.roles for select to authenticated
  using (true);

drop policy if exists roles_admin_write on public.roles;
create policy roles_admin_write
  on public.roles for all to authenticated
  using (public.current_user_has_permission('users:manage'))
  with check (public.current_user_has_permission('users:manage'));

drop policy if exists permissions_select_authenticated on public.permissions;
create policy permissions_select_authenticated
  on public.permissions for select to authenticated
  using (true);

drop policy if exists permissions_admin_write on public.permissions;
create policy permissions_admin_write
  on public.permissions for all to authenticated
  using (public.current_user_has_permission('users:manage'))
  with check (public.current_user_has_permission('users:manage'));

drop policy if exists role_permissions_select_authenticated on public.role_permissions;
create policy role_permissions_select_authenticated
  on public.role_permissions for select to authenticated
  using (true);

drop policy if exists role_permissions_admin_write on public.role_permissions;
create policy role_permissions_admin_write
  on public.role_permissions for all to authenticated
  using (public.current_user_has_permission('users:manage'))
  with check (public.current_user_has_permission('users:manage'));

drop policy if exists user_roles_select_self_or_admin on public.user_roles;
create policy user_roles_select_self_or_admin
  on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.current_user_has_permission('users:manage'));

drop policy if exists user_roles_admin_write on public.user_roles;
create policy user_roles_admin_write
  on public.user_roles for all to authenticated
  using (public.current_user_has_permission('users:manage'))
  with check (public.current_user_has_permission('users:manage'));

-- Note: No branch-scoped policies here (Q10 Open).
-- Note: No finance tables in Phase 2; finance:* permissions remain unassigned.
