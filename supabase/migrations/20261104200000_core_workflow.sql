-- Core customer-test workflow: machines, compliance, customers/sites,
-- single-machine hires, fixing jobs, hire eligibility enforced in DB.
-- Depends on Phase 2 auth/RBAC helpers (current_user_has_permission, etc.).
-- Multi-machine agreements remain Open (Q1) — this schema uses one machine_id
-- per hire_agreement intentionally until that decision is Confirmed.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Reference / organisation
-- ---------------------------------------------------------------------------

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.machine_types (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.machine_brands (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Machines
-- ---------------------------------------------------------------------------

create table if not exists public.machines (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  machine_type_id uuid references public.machine_types (id) on delete set null,
  machine_brand_id uuid references public.machine_brands (id) on delete set null,
  branch_id uuid references public.branches (id) on delete set null,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint machines_code_nonempty check (length(trim(code)) > 0),
  constraint machines_name_nonempty check (length(trim(name)) > 0)
);

create unique index if not exists machines_code_active_uidx
  on public.machines (lower(code))
  where deleted_at is null;

create index if not exists machines_branch_id_idx on public.machines (branch_id);
create index if not exists machines_type_id_idx on public.machines (machine_type_id);

drop trigger if exists machines_set_updated_at on public.machines;
create trigger machines_set_updated_at
before update on public.machines
for each row execute function public.set_updated_at();

drop trigger if exists branches_set_updated_at on public.branches;
create trigger branches_set_updated_at
before update on public.branches
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Compliance (append-only history; status from document_date)
-- ---------------------------------------------------------------------------

create table if not exists public.compliance_records (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references public.machines (id) on delete restrict,
  document_type text not null
    check (document_type in ('insurance', 'fitness', 'road_tracks')),
  -- Actual document Date (Confirmed) — not entry timestamp.
  document_date date not null,
  notes text,
  recorded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint compliance_document_date_not_future
    check (document_date <= (timezone('utc', now()))::date)
);

create index if not exists compliance_records_machine_type_date_idx
  on public.compliance_records (machine_id, document_type, document_date desc, created_at desc);

-- Reject updates/deletes so renewal history is preserved.
create or replace function public.reject_compliance_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'compliance_records are append-only; renew by inserting a new row'
    using errcode = 'check_violation';
end;
$$;

drop trigger if exists compliance_records_no_update on public.compliance_records;
create trigger compliance_records_no_update
before update on public.compliance_records
for each row execute function public.reject_compliance_mutation();

drop trigger if exists compliance_records_no_delete on public.compliance_records;
create trigger compliance_records_no_delete
before delete on public.compliance_records
for each row execute function public.reject_compliance_mutation();

-- Confirmed bands from actual document Date:
-- green < 9 months; yellow 9–<10 months; red ≥ 10 months.
create or replace function public.compliance_band_from_document_date(
  p_document_date date,
  p_as_of date default (timezone('utc', now()))::date
)
returns text
language sql
immutable
as $$
  select case
    when p_document_date is null then 'missing'
    when p_as_of < (p_document_date + interval '9 months')::date then 'green'
    when p_as_of < (p_document_date + interval '10 months')::date then 'yellow'
    else 'red'
  end;
$$;

create or replace function public.machine_latest_compliance_band(
  p_machine_id uuid,
  p_document_type text,
  p_as_of date default (timezone('utc', now()))::date
)
returns text
language sql
stable
as $$
  select coalesce(
    (
      select public.compliance_band_from_document_date(cr.document_date, p_as_of)
      from public.compliance_records cr
      where cr.machine_id = p_machine_id
        and cr.document_type = p_document_type
      order by cr.document_date desc, cr.created_at desc
      limit 1
    ),
    'missing'
  );
$$;

-- ---------------------------------------------------------------------------
-- Customers & sites (minimum for hiring)
-- ---------------------------------------------------------------------------

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  phone text,
  email text,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_code_nonempty check (length(trim(code)) > 0),
  constraint customers_name_nonempty check (length(trim(name)) > 0)
);

create unique index if not exists customers_code_active_uidx
  on public.customers (lower(code))
  where deleted_at is null;

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete restrict,
  name text not null,
  address text,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sites_name_nonempty check (length(trim(name)) > 0)
);

create index if not exists sites_customer_id_idx on public.sites (customer_id);

drop trigger if exists sites_set_updated_at on public.sites;
create trigger sites_set_updated_at
before update on public.sites
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Fixing / service / breakdown (minimal — blocks hire while open)
-- ---------------------------------------------------------------------------

create table if not exists public.machine_fixing_jobs (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references public.machines (id) on delete restrict,
  job_kind text not null
    check (job_kind in ('service', 'breakdown', 'repair')),
  status text not null default 'open'
    check (status in ('open', 'completed')),
  opened_at timestamptz not null default now(),
  completed_at timestamptz,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint machine_fixing_completed_requires_timestamp check (
    (status = 'open' and completed_at is null)
    or (status = 'completed' and completed_at is not null)
  )
);

create index if not exists machine_fixing_jobs_open_machine_idx
  on public.machine_fixing_jobs (machine_id)
  where status = 'open';

drop trigger if exists machine_fixing_jobs_set_updated_at on public.machine_fixing_jobs;
create trigger machine_fixing_jobs_set_updated_at
before update on public.machine_fixing_jobs
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Hire agreements (single machine; explicit activate + close)
-- No billing fields — billing rules are Open.
-- ---------------------------------------------------------------------------

create table if not exists public.hire_agreements (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references public.machines (id) on delete restrict,
  customer_id uuid not null references public.customers (id) on delete restrict,
  site_id uuid references public.sites (id) on delete set null,
  -- Confirmed duration kinds; pricing/calculation Open — store representation only.
  duration_type text not null
    check (duration_type in ('hours', 'days', 'months', 'open_ended')),
  planned_duration_value numeric,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'closed')),
  activated_at timestamptz,
  closed_at timestamptz,
  closed_by uuid references public.profiles (id) on delete set null,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hire_planned_duration_rules check (
    (duration_type = 'open_ended' and planned_duration_value is null)
    or (
      duration_type in ('hours', 'days', 'months')
      and planned_duration_value is not null
      and planned_duration_value > 0
    )
  ),
  constraint hire_active_requires_activated_at check (
    status <> 'active' or activated_at is not null
  ),
  constraint hire_closed_requires_closed_at check (
    status <> 'closed' or closed_at is not null
  )
);

-- DB-level: at most one active hire per machine (concurrent activation race guard).
create unique index if not exists hire_agreements_one_active_per_machine_uidx
  on public.hire_agreements (machine_id)
  where status = 'active';

create index if not exists hire_agreements_customer_id_idx
  on public.hire_agreements (customer_id);
create index if not exists hire_agreements_status_idx
  on public.hire_agreements (status);
create index if not exists hire_agreements_machine_id_idx
  on public.hire_agreements (machine_id);

drop trigger if exists hire_agreements_set_updated_at on public.hire_agreements;
create trigger hire_agreements_set_updated_at
before update on public.hire_agreements
for each row execute function public.set_updated_at();

create table if not exists public.hire_events (
  id uuid primary key default gen_random_uuid(),
  hire_agreement_id uuid not null references public.hire_agreements (id) on delete restrict,
  machine_id uuid not null references public.machines (id) on delete restrict,
  event_type text not null
    check (event_type in ('created', 'activated', 'closed', 'note')),
  detail text,
  actor_id uuid references public.profiles (id) on delete set null,
  occurred_at timestamptz not null default now()
);

create index if not exists hire_events_machine_occurred_idx
  on public.hire_events (machine_id, occurred_at desc);
create index if not exists hire_events_hire_occurred_idx
  on public.hire_events (hire_agreement_id, occurred_at desc);

create or replace function public.reject_hire_event_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'hire_events are append-only'
    using errcode = 'check_violation';
end;
$$;

drop trigger if exists hire_events_no_update on public.hire_events;
create trigger hire_events_no_update
before update on public.hire_events
for each row execute function public.reject_hire_event_mutation();

drop trigger if exists hire_events_no_delete on public.hire_events;
create trigger hire_events_no_delete
before delete on public.hire_events
for each row execute function public.reject_hire_event_mutation();

-- ---------------------------------------------------------------------------
-- Hire eligibility helpers + enforcement
-- ---------------------------------------------------------------------------

create or replace function public.machine_has_active_hire(p_machine_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.hire_agreements h
    where h.machine_id = p_machine_id
      and h.status = 'active'
  );
$$;

create or replace function public.machine_has_open_fixing(p_machine_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.machine_fixing_jobs j
    where j.machine_id = p_machine_id
      and j.status = 'open'
  );
$$;

create or replace function public.machine_compliance_all_green(p_machine_id uuid)
returns boolean
language sql
stable
as $$
  select
    public.machine_latest_compliance_band(p_machine_id, 'insurance') = 'green'
    and public.machine_latest_compliance_band(p_machine_id, 'fitness') = 'green'
    and public.machine_latest_compliance_band(p_machine_id, 'road_tracks') = 'green';
$$;

create or replace function public.machine_hire_blockers(p_machine_id uuid)
returns text[]
language plpgsql
stable
as $$
declare
  blockers text[] := '{}';
  band text;
begin
  if public.machine_has_active_hire(p_machine_id) then
    blockers := array_append(blockers, 'already_hired');
  end if;

  if public.machine_has_open_fixing(p_machine_id) then
    blockers := array_append(blockers, 'open_fixing');
  end if;

  foreach band in array array[
    public.machine_latest_compliance_band(p_machine_id, 'insurance'),
    public.machine_latest_compliance_band(p_machine_id, 'fitness'),
    public.machine_latest_compliance_band(p_machine_id, 'road_tracks')
  ]
  loop
    null; -- evaluated below per type for clearer messages
  end loop;

  if public.machine_latest_compliance_band(p_machine_id, 'insurance') <> 'green' then
    blockers := array_append(
      blockers,
      'compliance_insurance_' || public.machine_latest_compliance_band(p_machine_id, 'insurance')
    );
  end if;
  if public.machine_latest_compliance_band(p_machine_id, 'fitness') <> 'green' then
    blockers := array_append(
      blockers,
      'compliance_fitness_' || public.machine_latest_compliance_band(p_machine_id, 'fitness')
    );
  end if;
  if public.machine_latest_compliance_band(p_machine_id, 'road_tracks') <> 'green' then
    blockers := array_append(
      blockers,
      'compliance_road_tracks_' || public.machine_latest_compliance_band(p_machine_id, 'road_tracks')
    );
  end if;

  return blockers;
end;
$$;

create or replace function public.machine_can_activate_hire(p_machine_id uuid)
returns boolean
language sql
stable
as $$
  select coalesce(cardinality(public.machine_hire_blockers(p_machine_id)), 0) = 0;
$$;

create or replace function public.enforce_hire_activation()
returns trigger
language plpgsql
as $$
declare
  blockers text[];
begin
  -- Soft-deleted / missing machines cannot be hired.
  if not exists (
    select 1 from public.machines m
    where m.id = new.machine_id and m.deleted_at is null
  ) then
    raise exception 'machine_not_hirable: machine missing or deleted'
      using errcode = 'check_violation';
  end if;

  if tg_op = 'INSERT' then
    if new.status = 'active' then
      blockers := public.machine_hire_blockers(new.machine_id);
      -- machine_hire_blockers includes already_hired from OTHER rows only after insert
      -- uniqueness; strip self by rechecking without this row via explicit checks:
      blockers := '{}';
      if exists (
        select 1 from public.hire_agreements h
        where h.machine_id = new.machine_id and h.status = 'active' and h.id is distinct from new.id
      ) then
        blockers := array_append(blockers, 'already_hired');
      end if;
      if public.machine_has_open_fixing(new.machine_id) then
        blockers := array_append(blockers, 'open_fixing');
      end if;
      if public.machine_latest_compliance_band(new.machine_id, 'insurance') <> 'green' then
        blockers := array_append(blockers, 'compliance_insurance_' || public.machine_latest_compliance_band(new.machine_id, 'insurance'));
      end if;
      if public.machine_latest_compliance_band(new.machine_id, 'fitness') <> 'green' then
        blockers := array_append(blockers, 'compliance_fitness_' || public.machine_latest_compliance_band(new.machine_id, 'fitness'));
      end if;
      if public.machine_latest_compliance_band(new.machine_id, 'road_tracks') <> 'green' then
        blockers := array_append(blockers, 'compliance_road_tracks_' || public.machine_latest_compliance_band(new.machine_id, 'road_tracks'));
      end if;
      if coalesce(cardinality(blockers), 0) > 0 then
        raise exception 'hire_activation_blocked: %', array_to_string(blockers, ',')
          using errcode = 'check_violation';
      end if;
      if new.activated_at is null then
        new.activated_at := now();
      end if;
    end if;
    return new;
  end if;

  -- UPDATE path
  if new.status = 'active' and old.status is distinct from 'active' then
    blockers := '{}';
    if exists (
      select 1 from public.hire_agreements h
      where h.machine_id = new.machine_id and h.status = 'active' and h.id is distinct from new.id
    ) then
      blockers := array_append(blockers, 'already_hired');
    end if;
    if public.machine_has_open_fixing(new.machine_id) then
      blockers := array_append(blockers, 'open_fixing');
    end if;
    if public.machine_latest_compliance_band(new.machine_id, 'insurance') <> 'green' then
      blockers := array_append(blockers, 'compliance_insurance_' || public.machine_latest_compliance_band(new.machine_id, 'insurance'));
    end if;
    if public.machine_latest_compliance_band(new.machine_id, 'fitness') <> 'green' then
      blockers := array_append(blockers, 'compliance_fitness_' || public.machine_latest_compliance_band(new.machine_id, 'fitness'));
    end if;
    if public.machine_latest_compliance_band(new.machine_id, 'road_tracks') <> 'green' then
      blockers := array_append(blockers, 'compliance_road_tracks_' || public.machine_latest_compliance_band(new.machine_id, 'road_tracks'));
    end if;
    if coalesce(cardinality(blockers), 0) > 0 then
      raise exception 'hire_activation_blocked: %', array_to_string(blockers, ',')
        using errcode = 'check_violation';
    end if;
    if new.activated_at is null then
      new.activated_at := now();
    end if;
  end if;

  -- Prevent silent reopen of closed hires without going through draft (Proposed: closed is terminal).
  if old.status = 'closed' and new.status is distinct from 'closed' then
    raise exception 'closed_hire_is_terminal'
      using errcode = 'check_violation';
  end if;

  -- Auto-close is forbidden: closed_at must be set explicitly when closing.
  if new.status = 'closed' and old.status is distinct from 'closed' then
    if new.closed_at is null then
      new.closed_at := now();
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists hire_agreements_enforce_activation on public.hire_agreements;
create trigger hire_agreements_enforce_activation
before insert or update on public.hire_agreements
for each row execute function public.enforce_hire_activation();

-- Transactional activate RPC (preferred app path).
create or replace function public.activate_hire_agreement(p_hire_id uuid)
returns public.hire_agreements
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.hire_agreements;
begin
  if not public.current_user_has_permission('hires:write') then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into row
  from public.hire_agreements
  where id = p_hire_id
  for update;

  if not found then
    raise exception 'hire_not_found' using errcode = 'no_data_found';
  end if;

  if row.status = 'active' then
    return row;
  end if;

  if row.status = 'closed' then
    raise exception 'closed_hire_is_terminal' using errcode = 'check_violation';
  end if;

  update public.hire_agreements
  set status = 'active',
      activated_at = coalesce(activated_at, now())
  where id = p_hire_id
  returning * into row;

  insert into public.hire_events (hire_agreement_id, machine_id, event_type, detail, actor_id)
  values (row.id, row.machine_id, 'activated', 'Hire activated', auth.uid());

  return row;
end;
$$;

create or replace function public.close_hire_agreement(p_hire_id uuid, p_detail text default null)
returns public.hire_agreements
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.hire_agreements;
begin
  if not (
    public.current_user_has_permission('hires:close')
    or public.current_user_has_permission('hires:write')
  ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into row
  from public.hire_agreements
  where id = p_hire_id
  for update;

  if not found then
    raise exception 'hire_not_found' using errcode = 'no_data_found';
  end if;

  if row.status = 'closed' then
    return row;
  end if;

  if row.status <> 'active' then
    raise exception 'only_active_hires_can_close' using errcode = 'check_violation';
  end if;

  update public.hire_agreements
  set status = 'closed',
      closed_at = now(),
      closed_by = auth.uid()
  where id = p_hire_id
  returning * into row;

  insert into public.hire_events (hire_agreement_id, machine_id, event_type, detail, actor_id)
  values (
    row.id,
    row.machine_id,
    'closed',
    coalesce(nullif(trim(p_detail), ''), 'Hire closed explicitly'),
    auth.uid()
  );

  return row;
end;
$$;

revoke all on function public.activate_hire_agreement(uuid) from public;
revoke all on function public.close_hire_agreement(uuid, text) from public;
grant execute on function public.activate_hire_agreement(uuid) to authenticated;
grant execute on function public.close_hire_agreement(uuid, text) to authenticated;

grant execute on function public.compliance_band_from_document_date(date, date) to authenticated;
grant execute on function public.machine_latest_compliance_band(uuid, text, date) to authenticated;
grant execute on function public.machine_hire_blockers(uuid) to authenticated;
grant execute on function public.machine_can_activate_hire(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Dashboard helpers
-- ---------------------------------------------------------------------------

create or replace view public.v_machine_compliance_summary as
select
  m.id as machine_id,
  m.code as machine_code,
  m.name as machine_name,
  public.machine_latest_compliance_band(m.id, 'insurance') as insurance_band,
  public.machine_latest_compliance_band(m.id, 'fitness') as fitness_band,
  public.machine_latest_compliance_band(m.id, 'road_tracks') as road_tracks_band,
  public.machine_has_active_hire(m.id) as has_active_hire,
  public.machine_has_open_fixing(m.id) as has_open_fixing,
  public.machine_hire_blockers(m.id) as hire_blockers
from public.machines m
where m.deleted_at is null;

-- ---------------------------------------------------------------------------
-- Seed reference rows (idempotent labels — not DEMO fleet data)
-- ---------------------------------------------------------------------------

insert into public.machine_types (key, label) values
  ('excavator', 'Excavator'),
  ('loader', 'Loader'),
  ('roller', 'Roller'),
  ('grader', 'Grader'),
  ('other', 'Other')
on conflict (key) do nothing;

insert into public.machine_brands (key, label) values
  ('jcb', 'JCB'),
  ('caterpillar', 'Caterpillar'),
  ('komatsu', 'Komatsu'),
  ('volvo', 'Volvo'),
  ('other', 'Other')
on conflict (key) do nothing;

insert into public.branches (code, name) values
  ('NDOLA', 'Ndola Yard'),
  ('WORKSHOP', 'Workshop')
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.branches enable row level security;
alter table public.machine_types enable row level security;
alter table public.machine_brands enable row level security;
alter table public.machines enable row level security;
alter table public.compliance_records enable row level security;
alter table public.customers enable row level security;
alter table public.sites enable row level security;
alter table public.machine_fixing_jobs enable row level security;
alter table public.hire_agreements enable row level security;
alter table public.hire_events enable row level security;

-- Reference catalogues readable to authenticated; writable with machines:write / settings.
drop policy if exists branches_select on public.branches;
create policy branches_select on public.branches for select to authenticated
  using (public.current_user_has_permission('machines:read') or public.current_user_has_permission('hires:read'));

drop policy if exists branches_write on public.branches;
create policy branches_write on public.branches for all to authenticated
  using (public.current_user_has_permission('settings:manage') or public.current_user_has_permission('machines:write'))
  with check (public.current_user_has_permission('settings:manage') or public.current_user_has_permission('machines:write'));

drop policy if exists machine_types_select on public.machine_types;
create policy machine_types_select on public.machine_types for select to authenticated using (true);

drop policy if exists machine_brands_select on public.machine_brands;
create policy machine_brands_select on public.machine_brands for select to authenticated using (true);

drop policy if exists machines_select on public.machines;
create policy machines_select on public.machines for select to authenticated
  using (public.current_user_has_permission('machines:read'));

drop policy if exists machines_insert on public.machines;
create policy machines_insert on public.machines for insert to authenticated
  with check (public.current_user_has_permission('machines:write'));

drop policy if exists machines_update on public.machines;
create policy machines_update on public.machines for update to authenticated
  using (public.current_user_has_permission('machines:write'))
  with check (public.current_user_has_permission('machines:write'));

drop policy if exists compliance_select on public.compliance_records;
create policy compliance_select on public.compliance_records for select to authenticated
  using (public.current_user_has_permission('compliance:read'));

drop policy if exists compliance_insert on public.compliance_records;
create policy compliance_insert on public.compliance_records for insert to authenticated
  with check (public.current_user_has_permission('compliance:write'));

-- No update/delete policies — append-only (triggers also block).

drop policy if exists customers_select on public.customers;
create policy customers_select on public.customers for select to authenticated
  using (public.current_user_has_permission('customers:read'));

drop policy if exists customers_insert on public.customers;
create policy customers_insert on public.customers for insert to authenticated
  with check (public.current_user_has_permission('customers:write'));

drop policy if exists customers_update on public.customers;
create policy customers_update on public.customers for update to authenticated
  using (public.current_user_has_permission('customers:write'))
  with check (public.current_user_has_permission('customers:write'));

drop policy if exists sites_select on public.sites;
create policy sites_select on public.sites for select to authenticated
  using (public.current_user_has_permission('customers:read') or public.current_user_has_permission('hires:read'));

drop policy if exists sites_insert on public.sites;
create policy sites_insert on public.sites for insert to authenticated
  with check (public.current_user_has_permission('customers:write'));

drop policy if exists sites_update on public.sites;
create policy sites_update on public.sites for update to authenticated
  using (public.current_user_has_permission('customers:write'))
  with check (public.current_user_has_permission('customers:write'));

drop policy if exists fixing_select on public.machine_fixing_jobs;
create policy fixing_select on public.machine_fixing_jobs for select to authenticated
  using (public.current_user_has_permission('maintenance:read') or public.current_user_has_permission('machines:read'));

drop policy if exists fixing_insert on public.machine_fixing_jobs;
create policy fixing_insert on public.machine_fixing_jobs for insert to authenticated
  with check (public.current_user_has_permission('maintenance:write'));

drop policy if exists fixing_update on public.machine_fixing_jobs;
create policy fixing_update on public.machine_fixing_jobs for update to authenticated
  using (public.current_user_has_permission('maintenance:write'))
  with check (public.current_user_has_permission('maintenance:write'));

drop policy if exists hires_select on public.hire_agreements;
create policy hires_select on public.hire_agreements for select to authenticated
  using (public.current_user_has_permission('hires:read'));

drop policy if exists hires_insert on public.hire_agreements;
create policy hires_insert on public.hire_agreements for insert to authenticated
  with check (public.current_user_has_permission('hires:write'));

drop policy if exists hires_update on public.hire_agreements;
create policy hires_update on public.hire_agreements for update to authenticated
  using (
    public.current_user_has_permission('hires:write')
    or public.current_user_has_permission('hires:close')
  )
  with check (
    public.current_user_has_permission('hires:write')
    or public.current_user_has_permission('hires:close')
  );

drop policy if exists hire_events_select on public.hire_events;
create policy hire_events_select on public.hire_events for select to authenticated
  using (public.current_user_has_permission('hires:read'));

drop policy if exists hire_events_insert on public.hire_events;
create policy hire_events_insert on public.hire_events for insert to authenticated
  with check (public.current_user_has_permission('hires:write') or public.current_user_has_permission('hires:close'));

-- Note: No branch-scoped RLS (Q10 Open). No billing tables.
