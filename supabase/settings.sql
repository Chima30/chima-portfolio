create table settings(key text primary key, value text);
alter table settings enable row level security;
create policy "public reads" on settings for select using (true);
create policy "admin all" on settings for all using (is_admin()) with check (is_admin());
