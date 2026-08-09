alter table public.inventory_items
  drop constraint if exists inventory_items_status_check,
  drop constraint if exists inventory_items_sold_fields_check;

alter table public.inventory_items
  add constraint inventory_items_status_check
  check (status in ('available', 'reserved', 'sold')),
  add constraint inventory_items_sold_fields_check
  check (
    (
      status in ('available', 'reserved')
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
  );

notify pgrst, 'reload schema';
