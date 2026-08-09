alter table public.inventory_items
  add column if not exists reserved_at date,
  add column if not exists reservation_channel_id uuid,
  add column if not exists reservation_customer text,
  add column if not exists reservation_expires_at date,
  add column if not exists reservation_notes text;

alter table public.inventory_items
  drop constraint if exists inventory_items_status_check;

alter table public.inventory_items
  add constraint inventory_items_status_check
  check (status in ('available', 'reserved', 'sold'));

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'inventory_items'
      and constraint_name = 'inventory_items_reservation_channel_id_fkey'
  ) then
    alter table public.inventory_items
      add constraint inventory_items_reservation_channel_id_fkey
      foreign key (reservation_channel_id)
      references public.sales_channels(id)
      on delete set null;
  end if;
end $$;

alter table public.inventory_items
  drop constraint if exists inventory_items_sold_fields_check;

alter table public.inventory_items
  add constraint inventory_items_sold_fields_check check (
    (
      status = 'available'
      and sold_at is null
      and sale_price is null
      and sale_channel_id is null
      and reserved_at is null
      and reservation_channel_id is null
      and reservation_customer is null
      and reservation_expires_at is null
      and reservation_notes is null
    )
    or
    (
      status = 'reserved'
      and sold_at is null
      and sale_price is null
      and sale_channel_id is null
      and reserved_at is not null
    )
    or
    (
      status = 'sold'
      and sold_at is not null
      and sale_price is not null
      and sale_channel_id is not null
    )
  );

create index if not exists inventory_items_reserved_at_idx
  on public.inventory_items(reserved_at desc);

create index if not exists inventory_items_reservation_channel_id_idx
  on public.inventory_items(reservation_channel_id);

create index if not exists inventory_items_purchase_price_idx
  on public.inventory_items(purchase_price);

create index if not exists inventory_items_estimated_sale_price_idx
  on public.inventory_items(estimated_sale_price);

create index if not exists inventory_items_sale_price_idx
  on public.inventory_items(sale_price);

create table if not exists public.inventory_item_movements (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null
    references public.inventory_items(id)
    on delete cascade,
  event_type text not null,
  title text not null,
  notes text,
  created_at timestamptz not null default now(),
  constraint inventory_item_movements_event_type_check check (
    event_type in (
      'created',
      'updated',
      'reserved',
      'available',
      'sold',
      'deleted'
    )
  )
);

create index if not exists inventory_item_movements_item_created_idx
  on public.inventory_item_movements(inventory_item_id, created_at desc);

alter table public.inventory_item_movements enable row level security;

drop policy if exists "Authenticated users manage inventory movements"
  on public.inventory_item_movements;

create policy "Authenticated users manage inventory movements"
  on public.inventory_item_movements
  for all
  to authenticated
  using (true)
  with check (true);

notify pgrst, 'reload schema';
