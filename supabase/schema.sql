-- Run once in Supabase > SQL Editor. Replace the email at the bottom with yours.
create table admins(email text primary key);
alter table admins enable row level security;
create function is_admin() returns boolean language sql stable security definer set search_path=public as
$$ select exists(select 1 from admins where email = auth.jwt()->>'email') $$;

create table artworks(
  id uuid primary key default gen_random_uuid(),
  title text not null default '', description text default '',
  categories text[] default '{}', year int, project text, link text,
  image_path text not null,
  featured boolean default false, hero boolean default false,
  published boolean default false, position int default 0,
  created_at timestamptz default now());
create table projects(
  id uuid primary key default gen_random_uuid(),
  name text not null, cover_path text, description text, problem text, solution text,
  tech text[] default '{}', status text, github_url text, demo_url text, docs_url text,
  published boolean default false, position int default 0);

alter table artworks enable row level security;
alter table projects enable row level security;
create policy "public reads published" on artworks for select using (published);
create policy "public reads published" on projects for select using (published);
create policy "admin all" on artworks for all using (is_admin()) with check (is_admin());
create policy "admin all" on projects for all using (is_admin()) with check (is_admin());

insert into storage.buckets(id,name,public) values('art','art',true);
create policy "admin uploads" on storage.objects for insert to authenticated with check (bucket_id='art' and is_admin());
create policy "admin updates" on storage.objects for update to authenticated using (bucket_id='art' and is_admin());
create policy "admin deletes" on storage.objects for delete to authenticated using (bucket_id='art' and is_admin());

insert into admins values ('YOUR_EMAIL@example.com');
