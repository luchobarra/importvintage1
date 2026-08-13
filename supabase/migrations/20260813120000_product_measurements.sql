alter table public.products
  add column if not exists height_cm numeric(6, 2) not null,
  add column if not exists width_cm numeric(6, 2) not null;

alter table public.inventory_items
  add column if not exists height_cm numeric(6, 2),
  add column if not exists width_cm numeric(6, 2);

alter table public.products
  drop constraint if exists products_height_cm_check,
  drop constraint if exists products_width_cm_check;

alter table public.products
  add constraint products_height_cm_check check (height_cm > 0),
  add constraint products_width_cm_check check (width_cm > 0);

alter table public.inventory_items
  drop constraint if exists inventory_items_height_cm_check,
  drop constraint if exists inventory_items_width_cm_check;

alter table public.inventory_items
  add constraint inventory_items_height_cm_check check (
    height_cm is null or height_cm > 0
  ),
  add constraint inventory_items_width_cm_check check (
    width_cm is null or width_cm > 0
  );

notify pgrst, 'reload schema';
