create table if not exists public.price_calculator_settings (
  id boolean primary key default true,
  packaging_cost numeric(12, 2) not null default 1000,
  shipping_cost numeric(12, 2) not null default 1500,
  markup_rate numeric(7, 4) not null default 0.6,
  commission_rate numeric(7, 4) not null default 0,
  vat_rate numeric(7, 4) not null default 0.21,
  final_rounding_increment integer not null default 100,
  updated_at timestamptz not null default now(),
  constraint price_calculator_settings_singleton check (id = true),
  constraint price_calculator_settings_non_negative_values check (
    packaging_cost >= 0
    and shipping_cost >= 0
    and markup_rate >= 0
    and commission_rate >= 0
    and vat_rate >= 0
    and final_rounding_increment >= 1
  ),
  constraint price_calculator_settings_commission_limit check (commission_rate < 1)
);

alter table public.price_calculator_settings enable row level security;

drop policy if exists "Authenticated users manage price calculator settings"
  on public.price_calculator_settings;
create policy "Authenticated users manage price calculator settings"
  on public.price_calculator_settings
  for all
  to authenticated
  using (true)
  with check (true);

insert into public.price_calculator_settings (
  id,
  packaging_cost,
  shipping_cost,
  markup_rate,
  commission_rate,
  vat_rate,
  final_rounding_increment
)
values (true, 1000, 1500, 0.6, 0, 0.21, 100)
on conflict (id) do nothing;

notify pgrst, 'reload schema';
