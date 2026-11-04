-- DEMO capacity measurement queries.
-- Safe to run on local harness DB or staging Supabase after applying schema.sql + seed.
-- Does not print secrets. Results are sizes / counts only.

-- Row counts
select 'profiles' as entity, count(*) from demo_capacity.profiles
union all select 'machines', count(*) from demo_capacity.machines
union all select 'customers', count(*) from demo_capacity.customers
union all select 'hire_agreements', count(*) from demo_capacity.hire_agreements
union all select 'hire_items', count(*) from demo_capacity.hire_items
union all select 'hire_events', count(*) from demo_capacity.hire_events
union all select 'machine_readings', count(*) from demo_capacity.machine_readings
union all select 'fuel_events', count(*) from demo_capacity.fuel_events
union all select 'tyre_events', count(*) from demo_capacity.tyre_events
union all select 'maintenance_records', count(*) from demo_capacity.maintenance_records
union all select 'compliance_records', count(*) from demo_capacity.compliance_records
union all select 'audit_logs', count(*) from demo_capacity.audit_logs
order by 1;

-- Confirm no attachment blobs were stored
select
  count(*) as compliance_rows,
  count(storage_path) as rows_with_storage_path
from demo_capacity.compliance_records;

-- Per-relation sizes (table + indexes + toast)
select
  n.nspname as schema,
  c.relname as relation,
  pg_size_pretty(pg_total_relation_size(c.oid)) as total_size,
  pg_total_relation_size(c.oid) as total_bytes,
  pg_size_pretty(pg_relation_size(c.oid)) as table_size,
  pg_size_pretty(pg_indexes_size(c.oid)) as indexes_size
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'demo_capacity'
  and c.relkind = 'r'
order by pg_total_relation_size(c.oid) desc;

-- Schema total
select
  pg_size_pretty(coalesce(sum(pg_total_relation_size(c.oid)), 0)) as demo_capacity_total,
  coalesce(sum(pg_total_relation_size(c.oid)), 0) as demo_capacity_bytes
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'demo_capacity'
  and c.relkind = 'r';

-- Database total (includes system + empty public tables)
select
  current_database() as database,
  pg_size_pretty(pg_database_size(current_database())) as database_size,
  pg_database_size(current_database()) as database_bytes;

-- Free-tier DB headroom vs 500 MB (524288000 bytes)
with s as (
  select coalesce(sum(pg_total_relation_size(c.oid)), 0) as bytes
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'demo_capacity' and c.relkind = 'r'
)
select
  bytes as demo_capacity_bytes,
  round(100.0 * bytes / 524288000.0, 3) as pct_of_500mb_free_limit,
  round(100.0 * (1 - bytes / 524288000.0), 3) as headroom_pct_of_500mb
from s;
