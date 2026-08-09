alter table public.inventory_items
  add column if not exists condition_id uuid references public.catalog_product_conditions(id) on delete set null;

create index if not exists inventory_items_condition_id_idx
  on public.inventory_items(condition_id);

notify pgrst, 'reload schema';
