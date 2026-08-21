-- ============================================================================
-- Installer Notes — full schema introspection (READ-ONLY)
--
-- HOW TO USE:
--   1. Supabase Dashboard → SQL Editor → New query
--   2. Paste this entire file and click Run
--   3. The result is a single "line" column, one row per line of the dump,
--      already ordered into sections
--   4. Use "Download CSV" (most reliable for the full result) and share the
--      file back, OR select-all in the grid and copy/paste it back
--
-- This script ONLY reads from pg_catalog / information_schema-style views.
-- It creates, alters, and deletes nothing.
--
-- NOTE: this database is shared with another app, so unrelated tables,
-- functions, and policies will appear in the output. That is expected —
-- include it all; I'll sort out what belongs to Installer Notes.
-- ============================================================================

with
meta as (
  select 0 as sec, '0' as ord, ('PostgreSQL: ' || version()) as line
  union all
  select 0, '1', 'Generated at: ' || now()::text
),

-- Tables & columns (ordinary + partitioned tables in public)
cols as (
  select 10 as sec,
         (c.relname || '.' || lpad(a.attnum::text, 4, '0')) as ord,
         format('TABLE %s | %s %s%s%s',
                c.relname,
                a.attname,
                format_type(a.atttypid, a.atttypmod),
                case when a.attnotnull then ' NOT NULL' else '' end,
                case when ad.adbin is not null
                     then ' DEFAULT ' || pg_get_expr(ad.adbin, ad.adrelid)
                     else '' end) as line
  from pg_attribute a
  join pg_class c     on c.oid = a.attrelid
  join pg_namespace n on n.oid = c.relnamespace
  left join pg_attrdef ad on ad.adrelid = a.attrelid and ad.adnum = a.attnum
  where n.nspname = 'public'
    and c.relkind in ('r','p')
    and a.attnum > 0
    and not a.attisdropped
),

-- Whether RLS is enabled / forced per table
rls as (
  select 20 as sec, c.relname as ord,
         format('RLS  %s | rowsecurity=%s | force=%s',
                c.relname, c.relrowsecurity, c.relforcerowsecurity) as line
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('r','p')
),

-- PK / FK / UNIQUE / CHECK constraints (full DDL)
cons as (
  select 30 as sec, (t.relname || '.' || con.conname) as ord,
         format('CONSTRAINT %s | %s | %s',
                t.relname, con.conname, pg_get_constraintdef(con.oid)) as line
  from pg_constraint con
  join pg_class t     on t.oid = con.conrelid
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public'
),

-- Indexes
idx as (
  select 40 as sec, (tablename || '.' || indexname) as ord,
         format('INDEX %s | %s', tablename, indexdef) as line
  from pg_indexes
  where schemaname = 'public'
),

-- RLS policies on public tables
pol as (
  select 50 as sec, (tablename || '.' || policyname) as ord,
         format('POLICY %s | %s | cmd=%s | perm=%s | roles=%s | USING(%s) | WITHCHECK(%s)',
                tablename, policyname, cmd, permissive,
                array_to_string(roles::text[], ','),
                coalesce(qual, ''), coalesce(with_check, '')) as line
  from pg_policies
  where schemaname = 'public'
),

-- Storage buckets (relevant: installer-note-media, profile-pictures)
sbuckets as (
  select 60 as sec, name as ord,
         format('STORAGE BUCKET %s | public=%s | size_limit=%s | mime=%s',
                name, public,
                coalesce(file_size_limit::text, '-'),
                coalesce(array_to_string(allowed_mime_types, ','), '-')) as line
  from storage.buckets
),

-- Storage policies (policies live on storage.objects / storage.buckets)
spol as (
  select 70 as sec, (tablename || '.' || policyname) as ord,
         format('STORAGE POLICY on %s | %s | cmd=%s | roles=%s | USING(%s) | WITHCHECK(%s)',
                tablename, policyname, cmd,
                array_to_string(roles::text[], ','),
                coalesce(qual, ''), coalesce(with_check, '')) as line
  from pg_policies
  where schemaname = 'storage'
),

-- Enum types
enums as (
  select 80 as sec, t.typname as ord,
         format('ENUM %s = {%s}', t.typname,
                string_agg(e.enumlabel, ', ' order by e.enumsortorder)) as line
  from pg_type t
  join pg_enum e      on e.enumtypid = t.oid
  join pg_namespace n on n.oid = t.typnamespace
  where n.nspname = 'public'
  group by t.typname
),

-- Triggers (full definition incl. the function they call)
trig as (
  select 90 as sec, (c.relname || '.' || tg.tgname) as ord,
         pg_get_triggerdef(tg.oid) as line
  from pg_trigger tg
  join pg_class c     on c.oid = tg.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and not tg.tgisinternal
),

-- Views & materialized views
views as (
  select 100 as sec, viewname as ord,
         format('VIEW %s AS %s', viewname, definition) as line
  from pg_views where schemaname = 'public'
  union all
  select 100, matviewname,
         format('MATVIEW %s AS %s', matviewname, definition)
  from pg_matviews where schemaname = 'public'
),

-- Functions & procedures (skip extension-owned to cut noise)
funcs as (
  select 110 as sec,
         (p.proname || coalesce(pg_get_function_identity_arguments(p.oid), '')) as ord,
         format('FUNCTION %s(%s)', p.proname,
                coalesce(pg_get_function_identity_arguments(p.oid), ''))
           || E'\n' || pg_get_functiondef(p.oid) as line
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.prokind in ('f','p')
    and not exists (
      select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e'
    )
),

-- Section headers (empty ord sorts first within each section)
headers as (
  select sec, '' as ord, line from (values
    (10,  '===== TABLES & COLUMNS ====='),
    (20,  '===== RLS STATUS (per table) ====='),
    (30,  '===== CONSTRAINTS (PK/FK/UNIQUE/CHECK) ====='),
    (40,  '===== INDEXES ====='),
    (50,  '===== RLS POLICIES (public) ====='),
    (60,  '===== STORAGE BUCKETS ====='),
    (70,  '===== STORAGE POLICIES ====='),
    (80,  '===== ENUM TYPES ====='),
    (90,  '===== TRIGGERS ====='),
    (100, '===== VIEWS / MATERIALIZED VIEWS ====='),
    (110, '===== FUNCTIONS & PROCEDURES =====')
  ) as h(sec, line)
),

dump as (
  select * from meta
  union all select * from headers
  union all select * from cols
  union all select * from rls
  union all select * from cons
  union all select * from idx
  union all select * from pol
  union all select * from sbuckets
  union all select * from spol
  union all select * from enums
  union all select * from trig
  union all select * from views
  union all select * from funcs
)
select line
from dump
order by sec, ord, line;
