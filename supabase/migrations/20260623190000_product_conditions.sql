create table if not exists public.catalog_product_conditions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.products
  add column if not exists condition_id uuid references public.catalog_product_conditions(id),
  add column if not exists condition text;

create index if not exists products_condition_id_idx on public.products(condition_id);
create index if not exists catalog_product_conditions_active_position_idx
  on public.catalog_product_conditions(is_active, position, name);

alter table public.catalog_product_conditions enable row level security;

drop policy if exists "Public active catalog product conditions are readable" on public.catalog_product_conditions;
create policy "Public active catalog product conditions are readable"
  on public.catalog_product_conditions
  for select
  using (is_active = true);

drop policy if exists "Authenticated users manage catalog product conditions" on public.catalog_product_conditions;
create policy "Authenticated users manage catalog product conditions"
  on public.catalog_product_conditions
  for all
  to authenticated
  using (true)
  with check (true);

insert into public.catalog_product_conditions (name, slug, position)
values
  ('Excelente', 'excelente', 10),
  ('Muy bueno', 'muy-bueno', 20),
  ('Bueno', 'bueno', 30),
  ('Con detalles', 'con-detalles', 40),
  ('Vintage con uso', 'vintage-con-uso', 50)
on conflict (slug) do nothing;

update public.products product
set
  condition_id = condition.id,
  condition = condition.name
from public.catalog_product_conditions condition
where product.condition_id is null
  and condition.slug = 'muy-bueno';

alter table public.products
  alter column condition_id set not null,
  alter column condition set not null;

notify pgrst, 'reload schema';
