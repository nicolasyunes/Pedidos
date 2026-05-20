create type order_status as enum ('pedido', 'imprimiendo', 'listo', 'entregado', 'cancelado');
create type order_channel as enum ('whatsapp', 'instagram', 'facebook', 'presencial', 'otro');
create type order_priority as enum ('normal', 'urgente');
create type payment_status as enum ('sin_sena', 'con_sena', 'pagado');
create type payment_method as enum ('efectivo', 'transferencia', 'mercado_pago', 'otro');

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  suggested_price numeric(12,2) default 0,
  fields_json jsonb not null default '[]'::jsonb,
  is_favorite boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_templates_name on public.templates(name);
create index if not exists idx_templates_favorite on public.templates(is_favorite);
create index if not exists idx_templates_active on public.templates(is_active);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  channel order_channel not null default 'whatsapp',
  contact_handle text not null,
  product_name text not null,
  description text default '',
  customization_summary text default '',
  customizations_json jsonb not null default '[]'::jsonb,
  template_id uuid references public.templates(id),
  status order_status not null default 'pedido',
  payment_status payment_status not null default 'sin_sena',
  priority order_priority not null default 'normal',
  sale_price numeric(12,2) not null default 0,
  deposit_amount numeric(12,2) not null default 0,
  balance_amount numeric(12,2) not null default 0,
  final_payment_method payment_method,
  due_date date,
  notified boolean not null default false,
  notified_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_priority on public.orders(priority);
create index if not exists idx_orders_due_date on public.orders(due_date);
create index if not exists idx_orders_created_at on public.orders(created_at);
create index if not exists idx_orders_delivered_at on public.orders(delivered_at);
create index if not exists idx_orders_contact on public.orders(contact_handle);
create index if not exists idx_orders_product on public.orders(product_name);

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  event_type text not null,
  payload_json jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_order_events_order on public.order_events(order_id, created_at desc);

create or replace function public.normalize_order_fields()
returns trigger as $$
begin
  new.sale_price := greatest(coalesce(new.sale_price, 0), 0);
  new.deposit_amount := greatest(coalesce(new.deposit_amount, 0), 0);
  new.balance_amount := greatest(new.sale_price - new.deposit_amount, 0);

  if new.balance_amount = 0 and new.sale_price > 0 then
    new.payment_status := 'pagado';
  elsif new.deposit_amount > 0 then
    new.payment_status := 'con_sena';
  else
    new.payment_status := 'sin_sena';
  end if;

  if new.notified and new.notified_at is null then
    new.notified_at := now();
  elsif not new.notified then
    new.notified_at := null;
  end if;

  if new.status = 'entregado' and new.delivered_at is null then
    new.delivered_at := now();
  end if;

  if new.status = 'cancelado' and new.cancelled_at is null then
    new.cancelled_at := now();
  end if;

  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists normalize_order_fields_trigger on public.orders;
create trigger normalize_order_fields_trigger
before insert or update on public.orders
for each row execute function public.normalize_order_fields();

create or replace function public.log_order_changes()
returns trigger as $$
begin
  insert into public.order_events (order_id, event_type, payload_json, created_by)
  values (
    coalesce(new.id, old.id),
    case
      when tg_op = 'INSERT' then 'order_created'
      when tg_op = 'UPDATE' and old.status is distinct from new.status then 'status_changed'
      when tg_op = 'UPDATE' and old.notified is distinct from new.notified then 'notified_changed'
      when tg_op = 'UPDATE' and old.deposit_amount is distinct from new.deposit_amount then 'payment_updated'
      when tg_op = 'DELETE' then 'order_deleted'
      else 'order_updated'
    end,
    case
      when tg_op = 'DELETE' then row_to_json(old)::jsonb
      else row_to_json(new)::jsonb
    end,
    coalesce(new.created_by, old.created_by)
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists log_order_changes_trigger on public.orders;
create trigger log_order_changes_trigger
after insert or update or delete on public.orders
for each row execute function public.log_order_changes();

alter table public.templates enable row level security;
alter table public.orders enable row level security;
alter table public.order_events enable row level security;

drop policy if exists "templates_select" on public.templates;
create policy "templates_select" on public.templates for select using (auth.role() = 'authenticated');

drop policy if exists "templates_insert" on public.templates;
create policy "templates_insert" on public.templates for insert with check (auth.role() = 'authenticated');

drop policy if exists "templates_update" on public.templates;
create policy "templates_update" on public.templates for update using (auth.role() = 'authenticated');

drop policy if exists "orders_select" on public.orders;
create policy "orders_select" on public.orders for select using (auth.role() = 'authenticated');

drop policy if exists "orders_insert" on public.orders;
create policy "orders_insert" on public.orders for insert with check (auth.role() = 'authenticated');

drop policy if exists "orders_update" on public.orders;
create policy "orders_update" on public.orders for update using (auth.role() = 'authenticated');

drop policy if exists "orders_delete" on public.orders;
create policy "orders_delete" on public.orders for delete using (auth.role() = 'authenticated');

drop policy if exists "events_select" on public.order_events;
create policy "events_select" on public.order_events for select using (auth.role() = 'authenticated');
