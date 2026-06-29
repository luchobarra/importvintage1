alter table public.products
  add column if not exists is_exclusive boolean not null default false;

create index if not exists products_is_exclusive_idx
  on public.products(is_exclusive)
  where is_exclusive = true;
