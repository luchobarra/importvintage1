create table if not exists public.app_admin_users (
  email text primary key,
  created_at timestamptz not null default now(),
  constraint app_admin_users_email_lower_check check (email = lower(email))
);

alter table public.app_admin_users enable row level security;

insert into public.app_admin_users (email)
values ('importvintage1@gmail.com')
on conflict (email) do nothing;

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_admin_users admin_user
    where admin_user.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_app_admin() from public;
grant execute on function public.is_app_admin() to authenticated;

drop policy if exists "Admins can read app admin users" on public.app_admin_users;
create policy "Admins can read app admin users"
  on public.app_admin_users
  for select
  to authenticated
  using (public.is_app_admin());

drop policy if exists "Authenticated users manage sales channels" on public.sales_channels;
drop policy if exists "Admins manage sales channels" on public.sales_channels;
create policy "Admins manage sales channels"
  on public.sales_channels
  for all
  to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

drop policy if exists "Authenticated users manage inventory items" on public.inventory_items;
drop policy if exists "Admins manage inventory items" on public.inventory_items;
create policy "Admins manage inventory items"
  on public.inventory_items
  for all
  to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

drop policy if exists "Authenticated users manage inventory images" on public.inventory_item_images;
drop policy if exists "Admins manage inventory images" on public.inventory_item_images;
create policy "Admins manage inventory images"
  on public.inventory_item_images
  for all
  to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

drop policy if exists "Authenticated users manage inventory movements"
  on public.inventory_item_movements;
drop policy if exists "Admins manage inventory movements"
  on public.inventory_item_movements;
create policy "Admins manage inventory movements"
  on public.inventory_item_movements
  for all
  to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

notify pgrst, 'reload schema';
