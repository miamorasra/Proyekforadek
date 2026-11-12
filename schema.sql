-- Run this in Supabase SQL Editor AFTER creating the admin user in Authentication.
-- Replace YOUR_ADMIN_AUTH_USER_UUID with the admin user's Auth UID.
create extension if not exists pgcrypto;

create table if not exists public.vent_entries (
  id uuid primary key default gen_random_uuid(),
  content text not null check (length(trim(content)) > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id integer primary key check (id = 1),
  opening_text text not null default 'Hai sayang, hari ini kaka belum bisa ngertiin adek ya? Kaka berusaha sayang, hari ini capek ya? Tarik nafas pelan sayang, adek sekarang cerita aja semua yang adek mau keluarin, kaka akan selalu ada di sini dengerin adek.',
  validation_text text not null default 'Adek nggak berlebihan karena merasa lelah, kecewa, atau ingin dimengerti. Perasaan Adek valid. Adek nggak harus menghadapi semuanya sendirian. Kaka mungkin belum selalu paham, tapi Kaka mau belajar mendengarkan, memahami hal-hal kecil yang berarti buat Adek, dan membuktikannya lewat perubahan, bukan cuma janji. Terima kasih sudah mau cerita. Kaka di sini, ya.',
  bgm_url text,
  vo_urls jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id) values (1) on conflict (id) do nothing;

alter table public.vent_entries enable row level security;
alter table public.site_settings enable row level security;
revoke all on public.vent_entries from anon, authenticated;
revoke all on public.site_settings from anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant select, delete on public.vent_entries to authenticated;
grant update, insert on public.site_settings to authenticated;

-- Public can read only display settings; no public story read/insert/update/delete.
drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings" on public.site_settings
  for select to anon, authenticated using (true);

drop policy if exists "Admin reads stories" on public.vent_entries;
create policy "Admin reads stories" on public.vent_entries
  for select to authenticated using (auth.uid() = '376e12b1-45ac-4138-b07b-7ad8eb8eef71'::uuid);
drop policy if exists "Admin deletes stories" on public.vent_entries;
create policy "Admin deletes stories" on public.vent_entries
  for delete to authenticated using (auth.uid() = '376e12b1-45ac-4138-b07b-7ad8eb8eef71'::uuid);
drop policy if exists "Admin inserts settings" on public.site_settings;
create policy "Admin inserts settings" on public.site_settings
  for insert to authenticated with check (auth.uid() = '376e12b1-45ac-4138-b07b-7ad8eb8eef71'::uuid);
drop policy if exists "Admin updates settings" on public.site_settings;
create policy "Admin updates settings" on public.site_settings
  for update to authenticated using (auth.uid() = '376e12b1-45ac-4138-b07b-7ad8eb8eef71'::uuid)
  with check (auth.uid() = '376e12b1-45ac-4138-b07b-7ad8eb8eef71'::uuid);

-- Public audio playback; uploads and overwrites are admin-only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-audio', 'site-audio', true, 20971520, array['audio/mpeg','audio/mp3'])
on conflict (id) do update set public = true, file_size_limit = 20971520;

drop policy if exists "Public reads site audio" on storage.objects;
create policy "Public reads site audio" on storage.objects for select
  using (bucket_id = 'site-audio');
drop policy if exists "Admin uploads site audio" on storage.objects;
create policy "Admin uploads site audio" on storage.objects for insert to authenticated
  with check (bucket_id = 'site-audio' and auth.uid() = '376e12b1-45ac-4138-b07b-7ad8eb8eef71'::uuid);
drop policy if exists "Admin updates site audio" on storage.objects;
create policy "Admin updates site audio" on storage.objects for update to authenticated
  using (bucket_id = 'site-audio' and auth.uid() = '376e12b1-45ac-4138-b07b-7ad8eb8eef71'::uuid)
  with check (bucket_id = 'site-audio' and auth.uid() = '376e12b1-45ac-4138-b07b-7ad8eb8eef71'::uuid);
