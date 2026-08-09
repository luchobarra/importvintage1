create table if not exists public.sales_channels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create sequence if not exists public.inventory_visible_id_seq;

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  visible_id text not null unique default (
    'STK-' || lpad(nextval('public.inventory_visible_id_seq')::text, 5, '0')
  ),
  title text not null,
  category_id uuid references public.catalog_categories(id) on delete set null,
  purchase_date date not null default current_date,
  purchase_price numeric(12, 2) not null,
  estimated_sale_price numeric(12, 2),
  internal_description text,
  condition_notes text,
  internal_notes text,
  status text not null default 'available',
  sold_at date,
  sale_price numeric(12, 2),
  sale_channel_id uuid references public.sales_channels(id),
  sale_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_items_status_check check (status in ('available', 'sold')),
  constraint inventory_items_purchase_price_check check (purchase_price >= 0),
  constraint inventory_items_estimated_sale_price_check check (
    estimated_sale_price is null or estimated_sale_price >= 0
  ),
  constraint inventory_items_sale_price_check check (
    sale_price is null or sale_price >= 0
  ),
  constraint inventory_items_sold_fields_check check (
    (
      status = 'available'
      and sold_at is null
      and sale_price is null
      and sale_channel_id is null
    )
    or
    (
      status = 'sold'
      and sold_at is not null
      and sale_price is not null
      and sale_channel_id is not null
    )
  )
);

create table if not exists public.inventory_item_images (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references public.inventory_items(id) on delete cascade,
  image_url text not null,
  image_path text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.products
  add column if not exists inventory_item_id uuid references public.inventory_items(id) on delete set null;

create index if not exists sales_channels_active_position_idx
  on public.sales_channels(is_active, position, name);
create index if not exists inventory_items_status_idx
  on public.inventory_items(status);
create index if not exists inventory_items_visible_id_idx
  on public.inventory_items(visible_id);
create index if not exists inventory_items_category_id_idx
  on public.inventory_items(category_id);
create index if not exists inventory_items_purchase_date_idx
  on public.inventory_items(purchase_date desc);
create index if not exists inventory_items_sold_at_idx
  on public.inventory_items(sold_at desc);
create index if not exists inventory_items_sale_channel_id_idx
  on public.inventory_items(sale_channel_id);
create index if not exists inventory_items_title_search_idx
  on public.inventory_items
  using gin(to_tsvector('simple', title || ' ' || coalesce(internal_description, '')));
create index if not exists inventory_item_images_item_position_idx
  on public.inventory_item_images(inventory_item_id, position);
create index if not exists products_inventory_item_id_idx
  on public.products(inventory_item_id);

alter table public.sales_channels enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_item_images enable row level security;

drop policy if exists "Public active sales channels are readable" on public.sales_channels;
create policy "Public active sales channels are readable"
  on public.sales_channels
  for select
  using (is_active = true);

drop policy if exists "Authenticated users manage sales channels" on public.sales_channels;
create policy "Authenticated users manage sales channels"
  on public.sales_channels
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated users manage inventory items" on public.inventory_items;
create policy "Authenticated users manage inventory items"
  on public.inventory_items
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated users manage inventory images" on public.inventory_item_images;
create policy "Authenticated users manage inventory images"
  on public.inventory_item_images
  for all
  to authenticated
  using (true)
  with check (true);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists sales_channels_set_updated_at on public.sales_channels;
create trigger sales_channels_set_updated_at
  before update on public.sales_channels
  for each row
  execute function public.set_updated_at();

drop trigger if exists inventory_items_set_updated_at on public.inventory_items;
create trigger inventory_items_set_updated_at
  before update on public.inventory_items
  for each row
  execute function public.set_updated_at();

insert into public.sales_channels (name, slug, position)
values
  ('WhatsApp', 'whatsapp', 10),
  ('Instagram', 'instagram', 20),
  ('Local', 'local', 30),
  ('Catalogo', 'catalogo', 40)
on conflict (slug) do nothing;

notify pgrst, 'reload schema';
