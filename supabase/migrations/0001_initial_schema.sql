create extension if not exists "pgcrypto";

create table if not exists public.content (
  id uuid primary key default gen_random_uuid(),
  creator_wallet text not null,
  title text not null,
  description text,
  preview_text text,
  body_markdown text,
  storage_bucket text default 'locked-content',
  storage_path text,
  content_hash text not null,
  chain_content_pda text,
  price_lamports bigint not null check (price_lamports > 0),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.content(id) on delete cascade,
  buyer_pubkey text not null,
  tx_sig text not null unique,
  confirmed_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  constraint purchases_content_buyer_key unique (content_id, buyer_pubkey)
);

alter table public.content enable row level security;
alter table public.purchases enable row level security;

drop policy if exists "content_select_all" on public.content;
create policy "content_select_all"
on public.content
for select
using (true);

drop policy if exists "content_insert_all" on public.content;
create policy "content_insert_all"
on public.content
for insert
with check (true);

drop policy if exists "content_update_all" on public.content;
create policy "content_update_all"
on public.content
for update
using (true)
with check (true);

drop policy if exists "purchases_select_all" on public.purchases;
create policy "purchases_select_all"
on public.purchases
for select
using (true);

drop policy if exists "purchases_insert_all" on public.purchases;
create policy "purchases_insert_all"
on public.purchases
for insert
with check (true);

insert into storage.buckets (id, name, public)
values ('locked-content', 'locked-content', false)
on conflict (id) do nothing;

drop policy if exists "storage_access_locked_content" on storage.objects;
create policy "storage_access_locked_content"
on storage.objects
for all
using (bucket_id = 'locked-content')
with check (bucket_id = 'locked-content');
