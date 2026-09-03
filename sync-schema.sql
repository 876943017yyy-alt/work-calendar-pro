-- 在 Supabase SQL Editor 中执行一次。每个账号只能读写自己的同步记录。
create table if not exists public.work_calendar_sync (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.work_calendar_sync enable row level security;
drop policy if exists "users can read own calendar" on public.work_calendar_sync;
drop policy if exists "users can insert own calendar" on public.work_calendar_sync;
drop policy if exists "users can update own calendar" on public.work_calendar_sync;
create policy "users can read own calendar" on public.work_calendar_sync for select using (auth.uid() = user_id);
create policy "users can insert own calendar" on public.work_calendar_sync for insert with check (auth.uid() = user_id);
create policy "users can update own calendar" on public.work_calendar_sync for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
