grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update on table public.content to anon, authenticated, service_role;

grant select, insert, update on table public.purchases to anon, authenticated, service_role;
