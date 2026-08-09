alter table public.inventory_items
  add column if not exists brand_id uuid references public.catalog_brands(id) on delete set null;

create index if not exists inventory_items_brand_id_idx
  on public.inventory_items(brand_id);

notify pgrst, 'reload schema';
