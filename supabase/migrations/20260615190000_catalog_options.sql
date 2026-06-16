create table if not exists public.catalog_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sizes_letter_enabled boolean not null default true,
  sizes_numeric_enabled boolean not null default true,
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.catalog_categories
  add column if not exists sizes_letter_enabled boolean not null default true,
  add column if not exists sizes_numeric_enabled boolean not null default true;

create table if not exists public.catalog_brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.catalog_sizes (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  value text not null unique,
  size_group text not null default 'letter',
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.catalog_sizes
  add column if not exists size_group text not null default 'letter';

create table if not exists public.catalog_category_sizes (
  category_id uuid not null references public.catalog_categories(id) on delete cascade,
  size_id uuid not null references public.catalog_sizes(id) on delete cascade,
  primary key (category_id, size_id)
);

alter table public.products
  add column if not exists category_id uuid references public.catalog_categories(id),
  add column if not exists brand_id uuid references public.catalog_brands(id),
  add column if not exists size_id uuid references public.catalog_sizes(id);

create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists products_brand_id_idx on public.products(brand_id);
create index if not exists products_size_id_idx on public.products(size_id);
create index if not exists catalog_categories_active_position_idx on public.catalog_categories(is_active, position, name);
create index if not exists catalog_brands_active_position_idx on public.catalog_brands(is_active, position, name);
create index if not exists catalog_sizes_active_position_idx on public.catalog_sizes(is_active, size_group, position, label);

alter table public.catalog_categories enable row level security;
alter table public.catalog_brands enable row level security;
alter table public.catalog_sizes enable row level security;
alter table public.catalog_category_sizes enable row level security;

drop policy if exists "Public active catalog categories are readable" on public.catalog_categories;
create policy "Public active catalog categories are readable"
  on public.catalog_categories
  for select
  using (is_active = true);

drop policy if exists "Authenticated users manage catalog categories" on public.catalog_categories;
create policy "Authenticated users manage catalog categories"
  on public.catalog_categories
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Public active catalog brands are readable" on public.catalog_brands;
create policy "Public active catalog brands are readable"
  on public.catalog_brands
  for select
  using (is_active = true);

drop policy if exists "Authenticated users manage catalog brands" on public.catalog_brands;
create policy "Authenticated users manage catalog brands"
  on public.catalog_brands
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Public active catalog sizes are readable" on public.catalog_sizes;
create policy "Public active catalog sizes are readable"
  on public.catalog_sizes
  for select
  using (is_active = true);

drop policy if exists "Authenticated users manage catalog sizes" on public.catalog_sizes;
create policy "Authenticated users manage catalog sizes"
  on public.catalog_sizes
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Public catalog category sizes are readable" on public.catalog_category_sizes;
create policy "Public catalog category sizes are readable"
  on public.catalog_category_sizes
  for select
  using (true);

drop policy if exists "Authenticated users manage catalog category sizes" on public.catalog_category_sizes;
create policy "Authenticated users manage catalog category sizes"
  on public.catalog_category_sizes
  for all
  to authenticated
  using (true)
  with check (true);

insert into public.catalog_categories (name, slug, position)
values
  ('Pantalones', 'pantalones', 10),
  ('Buzos', 'buzos', 20),
  ('Polar', 'polar', 30)
on conflict (slug) do nothing;

update public.catalog_categories
set sizes_letter_enabled = true,
    sizes_numeric_enabled = true;

insert into public.catalog_sizes (label, value, size_group, position)
values
  ('XS', 'XS', 'letter', 10),
  ('S', 'S', 'letter', 20),
  ('M', 'M', 'letter', 30),
  ('L', 'L', 'letter', 40),
  ('XL', 'XL', 'letter', 50),
  ('XXL', 'XXL', 'letter', 60),
  ('XXXL', 'XXXL', 'letter', 70),
  ('36', '36', 'numeric', 10),
  ('38', '38', 'numeric', 20),
  ('40', '40', 'numeric', 30),
  ('42', '42', 'numeric', 40),
  ('44', '44', 'numeric', 50),
  ('46', '46', 'numeric', 60),
  ('48', '48', 'numeric', 70),
  ('50', '50', 'numeric', 80)
on conflict (value) do nothing;

update public.catalog_sizes
set size_group = case
  when value ~ '^[0-9]+$' then 'numeric'
  else 'letter'
end;

insert into public.catalog_category_sizes (category_id, size_id)
select category.id, size.id
from public.catalog_categories category
join public.catalog_sizes size on size.value in ('XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL')
where category.slug in ('buzos', 'polar')
on conflict do nothing;

insert into public.catalog_category_sizes (category_id, size_id)
select category.id, size.id
from public.catalog_categories category
join public.catalog_sizes size on size.value in ('36', '38', '40', '42', '44', '46', '48', '50')
where category.slug = 'pantalones'
on conflict do nothing;

insert into public.catalog_brands (name, slug, position)
select
  trimmed_brand,
  regexp_replace(lower(trimmed_brand), '[^a-z0-9]+', '-', 'g'),
  row_number() over (order by lower(trimmed_brand))::integer * 10
from (
  select distinct trim(brand) as trimmed_brand
  from public.products
  where trim(coalesce(brand, '')) <> ''
) brands
on conflict (slug) do nothing;

update public.products product
set category_id = category.id
from public.catalog_categories category
where product.category_id is null
  and lower(trim(product.category)) = category.slug;

update public.products product
set size_id = size.id
from public.catalog_sizes size
where product.size_id is null
  and upper(trim(product.size)) = size.value;

update public.products product
set brand_id = brand.id
from public.catalog_brands brand
where product.brand_id is null
  and regexp_replace(lower(trim(product.brand)), '[^a-z0-9]+', '-', 'g') = brand.slug;
