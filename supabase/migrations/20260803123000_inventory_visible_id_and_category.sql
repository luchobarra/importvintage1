create sequence if not exists public.inventory_visible_id_seq;

alter table public.inventory_items
  add column if not exists visible_id text,
  add column if not exists category_id uuid references public.catalog_categories(id) on delete set null;

update public.inventory_items
set visible_id = 'STK-' || lpad(nextval('public.inventory_visible_id_seq')::text, 5, '0')
where visible_id is null;

alter table public.inventory_items
  alter column visible_id set not null,
  alter column visible_id set default (
    'STK-' || lpad(nextval('public.inventory_visible_id_seq')::text, 5, '0')
  );

create unique index if not exists inventory_items_visible_id_key
  on public.inventory_items(visible_id);
create index if not exists inventory_items_visible_id_idx
  on public.inventory_items(visible_id);
create index if not exists inventory_items_category_id_idx
  on public.inventory_items(category_id);

notify pgrst, 'reload schema';
