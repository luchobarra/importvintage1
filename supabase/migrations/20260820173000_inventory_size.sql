alter table public.inventory_items
  add column if not exists size_id uuid references public.catalog_sizes(id) on delete set null;

create index if not exists inventory_items_size_id_idx
  on public.inventory_items(size_id);

notify pgrst, 'reload schema';
